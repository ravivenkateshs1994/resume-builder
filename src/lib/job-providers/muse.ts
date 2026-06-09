/**
 * The Muse Jobs API v2 provider.
 * Docs: https://www.themuse.com/developers/api/v2
 *
 * Notable behaviour:
 *  - Results are global / English-language, not geo-coded the way Adzuna is.
 *    Location is a plain string filter (e.g. "New York, NY" or "Remote").
 *  - `level` maps to: "Entry Level", "Mid Level", "Senior Level", "Management", "Internship".
 *  - `category` is a job-family string (e.g. "Software Engineer", "Data Science").
 *  - Pages are 0-indexed; max 100 results per page.
 */

import type { CareerStage } from "@/types/careerStage";
import type { JobEmploymentType, JobExperienceLevel, JobListing, JobPersona } from "@/types/jobs";

// ── Muse API shapes ──────────────────────────────────────────────────────────

interface MuseLevel {
  name: string;
  short_name: string;
}

interface MuseLocation {
  name: string;
}

interface MuseCategory {
  name: string;
  id: number;
}

interface MuseCompany {
  id: number;
  name: string;
  short_name: string;
}

interface MuseJobRecord {
  id: number;
  title?: string;
  publication_date?: string;
  short_name?: string;
  refs?: { landing_page?: string };
  contents?: string; // HTML description
  name?: string;
  type?: string; // "external" | "internal"
  company?: MuseCompany;
  levels?: MuseLevel[];
  locations?: MuseLocation[];
  categories?: MuseCategory[];
  tags?: Array<{ name: string }>;
}

interface MuseSearchResponse {
  page?: number;
  page_count?: number;
  items_per_page?: number;
  total?: number;
  results?: MuseJobRecord[];
}

// ── Options ──────────────────────────────────────────────────────────────────

interface MuseJobSearchOptions {
  /** Key skill/title from the candidate's resume (used to pick category). */
  query?: string;
  /** Free-text location from the candidate's profile. */
  location?: string;
  careerStage?: CareerStage | string | null;
  limit?: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function clean(value?: string | null): string {
  return (value ?? "").trim();
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim();
}

/** Map CareerStage to Muse experience-level filter values. */
function museLevel(careerStage?: string | null): string[] {
  if (careerStage === "FRESHER") return ["Entry Level", "Internship"];
  if (careerStage === "EXPERIENCED") return ["Mid Level", "Senior Level", "Management"];
  return []; // no filter → all levels
}

/**
 * Pick the most relevant Muse job category from the candidate query.
 * The Muse accepts category as a string; we loosely map common keywords.
 */
function pickMuseCategory(query: string): string {
  const q = query.toLowerCase();
  if (/\b(data\s*sci|machine\s*learn|ml|ai|deep\s*learn)\b/.test(q)) return "Data Science";
  if (/\b(data\s*(analyst|analytic|engineer|warehouse))\b/.test(q)) return "Data and Analytics";
  if (/\b(devops|sre|infra|cloud|kubernetes|terraform)\b/.test(q)) return "DevOps";
  if (/\b(design|ux|ui|product\s*design|figma)\b/.test(q)) return "Design and UX";
  if (/\b(product\s*manag|pm\b|roadmap)\b/.test(q)) return "Product";
  if (/\b(market|seo|content|social\s*media|brand|growth)\b/.test(q)) return "Marketing and PR";
  if (/\b(sales|account\s*exec|business\s*dev|bdr|sdr)\b/.test(q)) return "Sales";
  if (/\b(finance|accounting|fintech|analyst)\b/.test(q)) return "Finance";
  if (/\b(hr|recruit|talent|people\s*ops)\b/.test(q)) return "Human Resources";
  if (/\b(legal|counsel|compliance|attorney)\b/.test(q)) return "Legal";
  if (/\b(project|program\s*manag|pmo|scrum|agile)\b/.test(q)) return "Project Management";
  if (/\b(customer\s*(success|support|service)|cx)\b/.test(q)) return "Customer Service";
  if (/\b(operations|supply\s*chain|logistics|ops)\b/.test(q)) return "Operations";
  if (/\b(research|scientist|phd)\b/.test(q)) return "Science and Research";
  if (/\b(write|editor|content|copywrite|journalist)\b/.test(q)) return "Writing and Editing";
  // Default to software engineering for tech-related or unknown queries
  return "Software Engineer";
}

/** Derive our internal experience level from Muse level names. */
function inferExperienceLevel(levels: MuseLevel[], employmentType: JobEmploymentType): JobExperienceLevel {
  const names = levels.map((l) => l.name.toLowerCase());
  if (names.includes("internship")) return "entry";
  if (names.includes("entry level")) return "entry";
  if (names.includes("mid level")) return "mid";
  if (names.includes("senior level")) return "senior";
  if (names.includes("management")) return "manager";
  return employmentType === "full_time" ? "junior" : "entry";
}

function inferEmploymentType(title: string, levels: MuseLevel[]): JobEmploymentType {
  const t = title.toLowerCase();
  const isInternship = levels.some((l) => /intern/i.test(l.name)) || /\bintern(ship)?\b/.test(t);
  if (isInternship) return "internship";
  if (/\bpart.?time\b/.test(t)) return "part_time";
  if (/\bcontract\b/.test(t)) return "contract";
  return "full_time";
}

function inferBestForStage(experienceLevel: JobExperienceLevel, employmentType: JobEmploymentType): JobPersona[] {
  const fresher = employmentType === "internship" || experienceLevel === "entry" || experienceLevel === "junior";
  const experienced = ["mid", "senior", "lead", "manager"].includes(experienceLevel) || employmentType === "full_time";
  const stages = new Set<JobPersona>();
  if (fresher) stages.add("FRESHER");
  if (experienced) stages.add("EXPERIENCED");
  if (!stages.size) stages.add("EXPERIENCED");
  return [...stages];
}

function inferRemote(locations: MuseLocation[], title: string): boolean {
  return locations.some((l) => /remote/i.test(l.name)) || /\bremote\b/i.test(title);
}

/** Extract a plain-text location label from the first Muse location entry. */
function pickLocation(locations: MuseLocation[]): string {
  if (!locations.length) return "Remote";
  const first = locations[0].name;
  // The Muse can return "Flexible / Remote" — normalise
  if (/remote/i.test(first)) return "Remote";
  return first;
}

function extractSkills(text: string): string[] {
  const haystack = text.toLowerCase();
  const dictionary = [
    "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Python",
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "AWS", "GCP", "Azure", "Docker",
    "Kubernetes", "Terraform", "HTML", "CSS", "Tailwind", "Git", "Testing",
    "Automation", "Cypress", "Playwright", "Jest", "REST", "GraphQL", "Excel",
    "Tableau", "Power BI", "Figma", "UI/UX", "Communication", "Leadership",
    "Project Management", "Machine Learning", "Data Analysis", "Cloud", "Linux",
    "CI/CD", "Agile", "Scrum", "R", "Scala", "Java", "Kotlin", "Swift", "Go",
    "Rust", "C#", ".NET", "Ruby", "PHP", "Django", "Flask", "Spring Boot",
  ];

  return [...new Set(
    dictionary.filter((skill) => {
      const s = skill.toLowerCase();
      if (s === "rest") return /\brest\b/.test(haystack);
      if (s === "r") return /\br\b/.test(haystack);
      if (s === "go") return /\bgolang\b|\bgo\b/.test(haystack);
      if (s === "ui/ux") return /\bui\/ux\b|\buser experience\b|\buser interface\b/.test(haystack);
      if (s === "ci/cd") return /\bci\/cd\b|\bcontinuous integration\b/.test(haystack);
      if (s === "next.js") return /\bnext\.js\b|\bnextjs\b/.test(haystack);
      if (s === "node.js") return /\bnode\.js\b|\bnodejs\b/.test(haystack);
      return new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(haystack);
    })
  )];
}

function normalizeMuseJob(job: MuseJobRecord): JobListing | null {
  const title = clean(job.title ?? job.name);
  const company = clean(job.company?.name);
  const applyUrl = clean(job.refs?.landing_page);
  const rawDescription = clean(job.contents);
  const description = rawDescription ? stripHtml(rawDescription) : "";

  if (!title || !company || !applyUrl || !description) return null;

  const levels = job.levels ?? [];
  const locations = job.locations ?? [];
  const employmentType = inferEmploymentType(title, levels);
  const experienceLevel = inferExperienceLevel(levels, employmentType);
  const remote = inferRemote(locations, title);
  const location = remote ? "Remote" : pickLocation(locations);
  const bestForStage = inferBestForStage(experienceLevel, employmentType);
  const skills = extractSkills(description);
  const tags = [
    ...(job.categories?.map((c) => c.name) ?? []),
    ...levels.map((l) => l.name),
    ...(job.tags?.map((t) => t.name) ?? []),
  ].filter(Boolean);

  return {
    id: `muse-${job.id}`,
    source: "muse",
    externalId: String(job.id),
    title,
    company,
    location,
    remote,
    employmentType,
    experienceLevel,
    minYearsExperience: null,
    maxYearsExperience: null,
    industry: job.categories?.[0]?.name ?? undefined,
    description,
    applyUrl,
    skills,
    preferredSkills: [],
    tags,
    postedAt: job.publication_date ?? new Date().toISOString(),
    salaryMin: null,
    salaryMax: null,
    currency: null,
    bestForStage,
    featured: false,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export function canUseMuse(): boolean {
  return Boolean(clean(process.env.THE_MUSE_API_KEY));
}

export async function fetchMuseJobListings(options: MuseJobSearchOptions): Promise<JobListing[]> {
  const apiKey = clean(process.env.THE_MUSE_API_KEY);
  if (!apiKey) return [];

  const category = pickMuseCategory(clean(options.query));
  const levels = museLevel(options.careerStage);
  const limit = Math.max(10, Math.min(options.limit ?? 20, 100));

  // The Muse allows multiple `level` and `category` params via repeated keys.
  const url = new URL("https://www.themuse.com/api/public/jobs");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("category", category);
  url.searchParams.set("page", "0");
  url.searchParams.set("descending", "true");
  // Level filters
  for (const lvl of levels) {
    url.searchParams.append("level", lvl);
  }
  // Location — The Muse uses plain city/region strings; pass as-is when present.
  const locationFilter = clean(options.location);
  if (locationFilter) {
    url.searchParams.set("location", locationFilter);
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      // Next.js fetch cache: revalidate every 15 minutes
      next: { revalidate: 900 },
    } as RequestInit);
  } catch (err) {
    console.error("[Muse] Network error:", err);
    return [];
  }

  if (!response.ok) {
    console.error(`[Muse] API error ${response.status}: ${await response.text().catch(() => "")}`);
    return [];
  }

  let data: MuseSearchResponse;
  try {
    data = (await response.json()) as MuseSearchResponse;
  } catch {
    console.error("[Muse] Failed to parse JSON response");
    return [];
  }

  const results = Array.isArray(data.results) ? data.results : [];
  const jobs = results
    .map(normalizeMuseJob)
    .filter((job): job is JobListing => job !== null)
    .slice(0, limit);

  console.log(`[Muse] Fetched ${jobs.length} jobs for category="${category}" location="${locationFilter || "any"}"`);
  return jobs;
}

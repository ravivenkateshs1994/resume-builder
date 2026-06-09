import type { CareerStage } from "@/types/careerStage";
import type { JobExperienceLevel, JobListing, JobPersona, JobEmploymentType } from "@/types/jobs";

type AdzunaCountryCode =
  | "us"
  | "gb"
  | "in"
  | "ca"
  | "au"
  | "de"
  | "fr"
  | "es"
  | "nl"
  | "za"
  | "pl"
  | "br"
  | "mx"
  | "it"
  | "se"
  | "sg"
  | "ae"
  | "ch"
  | "at"
  | "be"
  | "ie"
  | "hk";

interface AdzunaJobRecord {
  id?: string | number;
  title?: string;
  company?: { display_name?: string };
  location?: { display_name?: string; area?: string[] };
  description?: string;
  redirect_url?: string;
  created?: string;
  contract_type?: string;
  contract_time?: string;
  category?: { label?: string; tag?: string };
  salary_min?: number | string | null;
  salary_max?: number | string | null;
  currency?: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface AdzunaSearchResponse {
  results?: AdzunaJobRecord[];
}

interface LiveJobSearchOptions {
  query?: string;
  location?: string;
  careerStage?: CareerStage | string | null;
  limit?: number;
}

const ADZUNA_BASE_URL = "https://api.adzuna.com/v1/api/jobs";

function clean(value?: string | null): string {
  return (value ?? "").trim();
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeTags(input: string[]): string[] {
  return [...new Set(input.map((item) => item.trim()).filter(Boolean))];
}

function detectCountry(location: string | undefined, fallback: AdzunaCountryCode = "us"): AdzunaCountryCode {
  const value = clean(location).toLowerCase();
  if (!value) return fallback;

  const mapping: Array<{ test: RegExp; code: AdzunaCountryCode }> = [
    { test: /\b(india|bengaluru|bangalore|hyderabad|pune|mumbai|delhi|noida|gurgaon|gurugram)\b/i, code: "in" },
    { test: /\b(united kingdom|uk|great britain|britain|england|scotland|wales|london|manchester|birmingham|edinburgh)\b/i, code: "gb" },
    { test: /\b(canada|toronto|vancouver|montreal|calgary|ottawa)\b/i, code: "ca" },
    { test: /\b(australia|sydney|melbourne|brisbane|perth)\b/i, code: "au" },
    { test: /\b(germany|berlin|munich|hamburg|frankfurt)\b/i, code: "de" },
    { test: /\b(france|paris|lyon|marseille)\b/i, code: "fr" },
    { test: /\b(spain|madrid|barcelona|valencia)\b/i, code: "es" },
    { test: /\b(netherlands|amsterdam|rotterdam|utrecht)\b/i, code: "nl" },
    { test: /\b(south africa|cape town|johannesburg|durban)\b/i, code: "za" },
    { test: /\b(poland|warsaw|krakow)\b/i, code: "pl" },
    { test: /\b(brazil|sao paulo|rio de janeiro)\b/i, code: "br" },
    { test: /\b(mexico|mexico city|monterrey|guadalajara)\b/i, code: "mx" },
    { test: /\b(italy|rome|milan|torino)\b/i, code: "it" },
    { test: /\b(sweden|stockholm|gothenburg|malmo)\b/i, code: "se" },
    { test: /\b(singapore)\b/i, code: "sg" },
    { test: /\b(united arab emirates|uae|dubai|abu dhabi)\b/i, code: "ae" },
    { test: /\b(switzerland|zurich|geneva|basel)\b/i, code: "ch" },
    { test: /\b(austria|vienna|wien)\b/i, code: "at" },
    { test: /\b(belgium|brussels|antwerp)\b/i, code: "be" },
    { test: /\b(ireland|dublin)\b/i, code: "ie" },
    { test: /\b(hong kong)\b/i, code: "hk" },
  ];

  const matched = mapping.find((entry) => entry.test.test(value));
  return matched?.code ?? fallback;
}

function getDefaultCountry(): AdzunaCountryCode {
  const value = clean(process.env.ADZUNA_DEFAULT_COUNTRY).toLowerCase();
  const allowed: AdzunaCountryCode[] = ["us", "gb", "in", "ca", "au", "de", "fr", "es", "nl", "za", "pl", "br", "mx", "it", "se", "sg", "ae", "ch", "at", "be", "ie", "hk"];
  return (allowed.includes(value as AdzunaCountryCode) ? (value as AdzunaCountryCode) : "in") as AdzunaCountryCode;
}

function inferEmploymentType(job: AdzunaJobRecord): JobEmploymentType {
  const text = `${job.title ?? ""} ${job.description ?? ""} ${job.contract_type ?? ""} ${job.contract_time ?? ""}`.toLowerCase();
  if (/\b(intern|internship)\b/.test(text)) return "internship";
  if (/\b(apprentice|apprenticeship)\b/.test(text)) return "apprenticeship";
  if (/\b(trainee|graduate|entry level|graduate programme|graduate program)\b/.test(text)) return "trainee";
  if (job.contract_time === "part_time") return "part_time";
  if (job.contract_type === "contract") return "contract";
  return "full_time";
}

function inferExperienceLevel(job: AdzunaJobRecord, employmentType: JobEmploymentType): JobExperienceLevel {
  const text = `${job.title ?? ""} ${job.description ?? ""}`.toLowerCase();
  if (employmentType === "internship" || employmentType === "apprenticeship" || employmentType === "trainee") return "entry";
  if (/\b(senior|staff|principal|lead|head|architect|manager)\b/.test(text)) {
    if (/\b(manager|head)\b/.test(text)) return "manager";
    if (/\b(lead|staff|principal|architect)\b/.test(text)) return "lead";
    return "senior";
  }
  if (/\b(junior|associate|assistant)\b/.test(text)) return "junior";
  if (/\b(mid|intermediate)\b/.test(text)) return "mid";
  return employmentType === "full_time" ? "junior" : "entry";
}

function inferBestForStage(job: AdzunaJobRecord, experienceLevel: JobExperienceLevel, employmentType: JobEmploymentType): JobPersona[] {
  const text = `${job.title ?? ""} ${job.description ?? ""}`.toLowerCase();
  const fresherFriendly = employmentType === "internship" || employmentType === "apprenticeship" || employmentType === "trainee" || experienceLevel === "entry" || experienceLevel === "junior";
  const experiencedFriendly =
    employmentType === "full_time" || employmentType === "contract" || experienceLevel === "mid" || experienceLevel === "senior" || experienceLevel === "lead" || experienceLevel === "manager";

  const stages = new Set<JobPersona>();
  if (fresherFriendly || /\b(graduate|entry level|new grad|new graduate|intern)\b/.test(text)) stages.add("FRESHER");
  if (experiencedFriendly || /\b(senior|lead|manager|principal|staff|architect)\b/.test(text)) stages.add("EXPERIENCED");

  if (!stages.size) stages.add(employmentType === "full_time" ? "EXPERIENCED" : "FRESHER");
  return [...stages];
}

function extractSkills(text: string): string[] {
  const haystack = text.toLowerCase();
  const dictionary = [
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Python",
    "SQL",
    "PostgreSQL",
    "AWS",
    "Docker",
    "Kubernetes",
    "HTML",
    "CSS",
    "Tailwind",
    "Git",
    "Testing",
    "Automation",
    "Cypress",
    "Playwright",
    "Jest",
    "API",
    "REST",
    "GraphQL",
    "Excel",
    "Tableau",
    "Power BI",
    "Figma",
    "UI/UX",
    "Communication",
    "Leadership",
    "Project Management",
    "Machine Learning",
    "Data Analysis",
    "Cloud",
    "Linux",
    "CI/CD",
  ];

  return normalizeTags(
    dictionary.filter((skill) => {
      const normalized = skill.toLowerCase();
      if (normalized === "api") return /\bapi\b/.test(haystack);
      if (normalized === "rest") return /\brest\b/.test(haystack);
      if (normalized === "ui/ux") return /\bui\/ux\b|\buser experience\b|\buser interface\b/.test(haystack);
      if (normalized === "ci/cd") return /\bci\/cd\b|\bcontinuous integration\b|\bcontinuous delivery\b/.test(haystack);
      if (normalized === "next.js") return /\bnext\.js\b|\bnextjs\b/.test(haystack);
      if (normalized === "node.js") return /\bnode\.js\b|\bnodejs\b/.test(haystack);
      return new RegExp(`\\b${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(haystack);
    })
  );
}

function buildTags(job: AdzunaJobRecord, employmentType: JobEmploymentType, location: string): string[] {
  return normalizeTags([
    job.category?.label ?? "",
    job.category?.tag ?? "",
    employmentType,
    clean(job.contract_type ?? ""),
    clean(job.contract_time ?? ""),
    location,
  ]);
}

function inferRemote(displayName: string, text: string): boolean {
  return /\b(remote|work from home|wfh|telecommute)\b/i.test(`${displayName} ${text}`);
}

function getSalary(value: unknown): number | null {
  return toNumber(value);
}

function buildQueryParts(options: LiveJobSearchOptions): { what: string; where?: string } {
  const candidateQuery = clean(options.query);
  const location = clean(options.location);
  const stage = options.careerStage === "EXPERIENCED" ? "EXPERIENCED" : "FRESHER";

  const what = candidateQuery || (stage === "FRESHER" ? "internship graduate entry level" : "software engineer developer");
  const where = location || undefined;

  return { what, where };
}

function buildAdzunaUrl(country: AdzunaCountryCode, options: LiveJobSearchOptions): URL | null {
  const appId = clean(process.env.ADZUNA_APP_ID);
  const appKey = clean(process.env.ADZUNA_APP_KEY);
  if (!appId || !appKey) return null;

  const page = 1;
  const url = new URL(`${ADZUNA_BASE_URL}/${country}/search/${page}`);
  const params = url.searchParams;
  const { what, where } = buildQueryParts(options);

  params.set("app_id", appId);
  params.set("app_key", appKey);
  params.set("content-type", "application/json");
  params.set("results_per_page", String(Math.max(10, Math.min(options.limit ?? 20, 50))));
  params.set("what", what);

  if (where) params.set("where", where);
  if ((options.careerStage ?? "FRESHER") === "EXPERIENCED") {
    params.set("full_time", "1");
    params.set("permanent", "1");
  }

  return url;
}

function mapAdzunaJob(record: AdzunaJobRecord, fallbackStage: JobPersona): JobListing | null {
  const id = clean(String(record.id ?? ""));
  const title = clean(record.title);
  const company = clean(record.company?.display_name);
  const description = clean(record.description);
  const applyUrl = clean(record.redirect_url);
  const location = clean(record.location?.display_name) || "Remote";

  if (!id || !title || !company || !description || !applyUrl) return null;

  const employmentType = inferEmploymentType(record);
  const experienceLevel = inferExperienceLevel(record, employmentType);
  const bestForStage = inferBestForStage(record, experienceLevel, employmentType);
  const skills = extractSkills(`${title} ${company} ${description} ${record.category?.label ?? ""}`);
  const locationText = clean(record.location?.display_name);
  const text = `${title} ${description} ${locationText}`;

  return {
    id: `adzuna-${id}`,
    source: "adzuna",
    externalId: id,
    title,
    company,
    location,
    remote: inferRemote(locationText, text),
    employmentType,
    experienceLevel,
    minYearsExperience:
      employmentType === "internship" || employmentType === "apprenticeship" || employmentType === "trainee"
        ? 0
        : experienceLevel === "entry"
          ? 0
          : experienceLevel === "junior"
            ? 1
            : experienceLevel === "mid"
              ? 3
              : experienceLevel === "senior"
                ? 5
                : experienceLevel === "lead"
                  ? 7
                  : 10,
    maxYearsExperience:
      employmentType === "internship" || employmentType === "apprenticeship" || employmentType === "trainee"
        ? 1
        : experienceLevel === "entry"
          ? 1
          : experienceLevel === "junior"
            ? 2
            : experienceLevel === "mid"
              ? 5
              : experienceLevel === "senior"
                ? 8
                : experienceLevel === "lead"
                  ? 12
                  : 15,
    industry: clean(record.category?.label) || undefined,
    description,
    applyUrl,
    skills,
    preferredSkills: [],
    tags: buildTags(record, employmentType, locationText),
    postedAt: record.created || new Date().toISOString(),
    salaryMin: getSalary(record.salary_min),
    salaryMax: getSalary(record.salary_max),
    currency: clean(record.currency) || null,
    bestForStage: bestForStage.length ? bestForStage : [fallbackStage],
    featured: /\b(lead|senior|top|featured|urgent)\b/i.test(`${title} ${description}`),
  };
}

export function canUseAdzuna(): boolean {
  return Boolean(clean(process.env.ADZUNA_APP_ID) && clean(process.env.ADZUNA_APP_KEY));
}

export async function fetchAdzunaJobListings(options: LiveJobSearchOptions): Promise<JobListing[]> {
  const country = detectCountry(options.location, getDefaultCountry());
  const url = buildAdzunaUrl(country, options);
  if (!url) return [];

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    throw new Error(`Adzuna request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as AdzunaSearchResponse;
  const stage = options.careerStage === "EXPERIENCED" ? "EXPERIENCED" : "FRESHER";
  return Array.isArray(payload.results)
    ? payload.results.map((record) => mapAdzunaJob(record, stage)).filter((item): item is JobListing => Boolean(item))
    : [];
}

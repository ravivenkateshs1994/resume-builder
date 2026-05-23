import type { ResumeData } from "@/types/resume";
import { parseResume, type ParsedResume } from "./parseResume";
import {
  findSkillsInText,
  normalizeSkillBatch,
  normalizeSkillNames,
  registerSkillTaxonomyEntries,
  type NormalizedSkill,
  type SkillCategory,
  type SkillTaxonomyEntry,
} from "./skill-taxonomy";
import { defaultAtsScoringService, type AtsAnalysisResult } from "./ats-engine";

export interface ResumeSignalExtraction {
  skills: string[];
  technologies: string[];
  tools: string[];
  frameworks: string[];
  certifications: string[];
  methodologies: string[];
  jobTitles: string[];
  companies: string[];
  achievements: string[];
  dates: string[];
}

export interface JobDescriptionSignalExtraction {
  requiredSkills: string[];
  preferredSkills: string[];
  tools: string[];
  frameworks: string[];
  certifications: string[];
  yearsExperience: number | null;
  seniority: JobSeniority;
  responsibilities: string[];
}

export type JobSeniority = "entry" | "junior" | "mid" | "senior" | "lead" | "manager" | "director" | "executive" | "unknown";

export interface ScoreDetail {
  score: number;
  explanation: string;
  evidence: string[];
}

export interface ResumeIntelligenceReport {
  resumeSignals: ResumeSignalExtraction;
  jobDescriptionSignals: JobDescriptionSignalExtraction;
  overallScore: number;
  atsCompatibilityScore: number;
  jobMatchScore: number;
  recruiterAppealScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  scoreBreakdown: {
    overall: ScoreDetail;
    atsCompatibility: ScoreDetail;
    jobMatch: ScoreDetail;
    recruiterAppeal: ScoreDetail;
    skillCoverage: ScoreDetail;
    experienceAlignment: ScoreDetail;
    achievementImpact: ScoreDetail;
  };
  deterministicAnalysis: AtsAnalysisResult;
}

interface AiSkillPayload {
  skills?: unknown;
  technologies?: unknown;
  tools?: unknown;
  frameworks?: unknown;
  certifications?: unknown;
  methodologies?: unknown;
}

interface AiJobDescriptionPayload {
  requiredSkills?: unknown;
  preferredSkills?: unknown;
  tools?: unknown;
  frameworks?: unknown;
  certifications?: unknown;
  yearsExperience?: unknown;
  seniority?: unknown;
  responsibilities?: unknown;
}

interface ResumeSignalSource {
  personalInfo?: {
    jobTitle?: string;
  };
  targetRole?: string;
  summary?: string;
  workExperience?: Array<{
    company?: string;
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }>;
  education?: Array<{
    startDate?: string;
    endDate?: string;
  }>;
  skills?: string[];
  certifications?: Array<{
    name?: string;
    issuer?: string;
    date?: string;
  }>;
}

interface AiResumePersonalInfoPayload {
  fullName?: unknown;
  email?: unknown;
  phone?: unknown;
  location?: unknown;
  linkedin?: unknown;
  website?: unknown;
  jobTitle?: unknown;
}

interface AiResumeExperiencePayload {
  company?: unknown;
  title?: unknown;
  location?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  bullets?: unknown;
  description?: unknown;
}

interface AiResumeEducationPayload {
  institution?: unknown;
  degree?: unknown;
  field?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  gpa?: unknown;
  honors?: unknown;
}

interface AiResumeCertificationPayload {
  name?: unknown;
  issuer?: unknown;
  date?: unknown;
  credentialId?: unknown;
  validFrom?: unknown;
  validTo?: unknown;
  neverExpires?: unknown;
}

interface AiResumeStructurePayload {
  personalInfo?: AiResumePersonalInfoPayload;
  summary?: unknown;
  workExperience?: unknown;
  education?: unknown;
  skills?: unknown;
  certifications?: unknown;
  targetRole?: unknown;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function normalizeExtractedText(value: string): string {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\t/g, "  ")
    .replace(/([^\n])-\n([a-z])/g, "$1$2")
    .replace(/[ \t]{3,}/g, "  ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeAiString(value: unknown): string {
  return typeof value === "string" ? normalizeWhitespace(value) : "";
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function normalizeContactUrl(value: string): string {
  if (!value) {
    return "";
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value.replace(/^\/+/, "")}`;
}

function collectBullets(value: unknown): string[] {
  if (Array.isArray(value)) {
    return toArrayOfStrings(value);
  }

  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(/\r?\n+/)
    .map((line) => line.replace(/^[\s*-•·\d.)]+/, "").trim())
    .filter(Boolean);
}

function bulletsToHtml(bullets: string[]): string {
  if (bullets.length === 0) {
    return "";
  }

  return `<ul>${bullets.map((bullet) => `<li><p>${escapeHtml(bullet)}</p></li>`).join("")}</ul>`;
}

function isLikelyName(value: string): boolean {
  const normalized = value.trim();
  if (!normalized || normalized.length > 60) {
    return false;
  }

  if (/[.@/:]|linkedin|http|www|resume|curriculum|profile|contact|summary|experience/i.test(normalized)) {
    return false;
  }

  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 4) {
    return false;
  }

  return words.every((word) => /^[A-Z][A-Za-z'.-]*$/.test(word) || /^[A-Z]\.?$/.test(word));
}

function isLikelyTitle(value: string): boolean {
  const normalized = value.trim();
  if (!normalized || normalized.length > 80) {
    return false;
  }

  if (/[.@/:]|linkedin|http|www/i.test(normalized)) {
    return false;
  }

  if (/\b(summary|experience|education|skills|certifications?)\b/i.test(normalized)) {
    return false;
  }

  const words = normalized.split(/\s+/).filter(Boolean);
  return words.length >= 2 && words.length <= 8;
}

function chooseStructuredText(aiValue: string, fallbackValue: string, validator: (value: string) => boolean): string {
  if (validator(aiValue)) {
    return aiValue;
  }

  if (validator(fallbackValue)) {
    return fallbackValue;
  }

  return aiValue || fallbackValue;
}

function normalizePersonalInfo(
  aiPersonalInfo: AiResumePersonalInfoPayload | undefined,
  fallback: ParsedResume["personalInfo"]
): ParsedResume["personalInfo"] {
  const aiFullName = normalizeAiString(aiPersonalInfo?.fullName);
  const fallbackFullName = normalizeAiString(fallback.fullName);
  const aiJobTitle = normalizeAiString(aiPersonalInfo?.jobTitle);
  const fallbackJobTitle = normalizeAiString(fallback.jobTitle);

  return {
    fullName: chooseStructuredText(aiFullName, fallbackFullName, isLikelyName),
    email: normalizeAiString(aiPersonalInfo?.email) || fallback.email,
    phone: normalizeAiString(aiPersonalInfo?.phone) || fallback.phone,
    location: normalizeAiString(aiPersonalInfo?.location) || fallback.location,
    linkedin: normalizeContactUrl(normalizeAiString(aiPersonalInfo?.linkedin) || fallback.linkedin),
    website: normalizeContactUrl(normalizeAiString(aiPersonalInfo?.website) || fallback.website),
    jobTitle: chooseStructuredText(aiJobTitle, fallbackJobTitle, isLikelyTitle),
  };
}

function normalizeExperienceEntries(entries: unknown): ParsedResume["workExperience"] {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as AiResumeExperiencePayload;
      const title = normalizeAiString(candidate.title);
      const company = normalizeAiString(candidate.company);
      const location = normalizeAiString(candidate.location);
      const startDate = normalizeAiString(candidate.startDate);
      const endDate = normalizeAiString(candidate.endDate);
      const bullets = collectBullets(candidate.bullets).length > 0 ? collectBullets(candidate.bullets) : collectBullets(candidate.description);

      if (!title && !company && !location && !startDate && !endDate && bullets.length === 0) {
        return null;
      }

      return {
        id: uid(),
        company,
        title,
        location,
        startDate,
        endDate,
        description: bulletsToHtml(bullets),
      };
    })
    .filter((entry): entry is ParsedResume["workExperience"][number] => Boolean(entry));
}

function normalizeEducationEntries(entries: unknown): ParsedResume["education"] {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as AiResumeEducationPayload;
      const institution = normalizeAiString(candidate.institution);
      const degree = normalizeAiString(candidate.degree);
      const field = normalizeAiString(candidate.field);
      const startDate = normalizeAiString(candidate.startDate);
      const endDate = normalizeAiString(candidate.endDate);
      const gpa = normalizeAiString(candidate.gpa);
      const honors = normalizeAiString(candidate.honors);

      if (!institution && !degree && !field && !startDate && !endDate && !gpa && !honors) {
        return null;
      }

      return {
        id: uid(),
        institution,
        degree,
        field,
        startDate,
        endDate,
        gpa,
        honors,
      };
    })
    .filter((entry): entry is ParsedResume["education"][number] => Boolean(entry));
}

function normalizeCertificationEntries(entries: unknown): ParsedResume["certifications"] {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as AiResumeCertificationPayload;
      const name = normalizeAiString(candidate.name);
      const issuer = normalizeAiString(candidate.issuer);
      const date = normalizeAiString(candidate.date);

      if (!name && !issuer && !date) {
        return null;
      }

      return {
        id: uid(),
        name,
        issuer,
        date,
      };
    })
    .filter((entry): entry is ParsedResume["certifications"][number] => Boolean(entry));
}

function mergeCertificationEntries(
  primary: ParsedResume["certifications"],
  secondary: ParsedResume["certifications"]
): ParsedResume["certifications"] {
  const merged = new Map<string, ParsedResume["certifications"][number]>();

  for (const entry of [...primary, ...secondary]) {
    const key = entry.name.trim().toLowerCase();
    if (!key) {
      continue;
    }

    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { ...entry, id: uid() });
      continue;
    }

    merged.set(key, {
      ...existing,
      issuer: existing.issuer || entry.issuer,
      date: existing.date || entry.date,
    });
  }

  return [...merged.values()];
}

function mergeResumeStructure(fallback: ParsedResume, aiPayload: AiResumeStructurePayload | null): ParsedResume {
  if (!aiPayload) {
    return fallback;
  }

  const aiPersonalInfo = normalizePersonalInfo(aiPayload.personalInfo, fallback.personalInfo);
  const aiWorkExperience = normalizeExperienceEntries(aiPayload.workExperience);
  const aiEducation = normalizeEducationEntries(aiPayload.education);
  const aiCertifications = normalizeCertificationEntries(aiPayload.certifications);
  const aiSkills = dedupePreserveOrder(toArrayOfStrings(aiPayload.skills));
  const aiSummary = normalizeAiString(aiPayload.summary);
  const aiTargetRole = normalizeAiString(aiPayload.targetRole);

  return {
    personalInfo: aiPersonalInfo,
    summary: aiSummary || fallback.summary,
    workExperience: aiWorkExperience.length > 0 ? aiWorkExperience : fallback.workExperience,
    education: aiEducation.length > 0 ? aiEducation : fallback.education,
    skills: dedupePreserveOrder([...aiSkills, ...fallback.skills]),
    certifications: mergeCertificationEntries(aiCertifications, fallback.certifications),
    targetRole: aiTargetRole || aiPersonalInfo.jobTitle || fallback.targetRole,
  };
}

function stripMarkdownFences(value: string): string {
  return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function dedupePreserveOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = normalizeWhitespace(value);
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function toArrayOfStrings(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? normalizeWhitespace(item) : ""))
    .filter(Boolean);
}

function parseJsonObject<T>(raw: string): T | null {
  try {
    return JSON.parse(stripMarkdownFences(raw)) as T;
  } catch {
    return null;
  }
}

async function generateJson<T>(prompt: string, imageDataUrls: string[] = []): Promise<T | null> {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  try {
    const { generate, generateWithImages } = await import("./openai");
    const raw =
      imageDataUrls.length > 0
        ? await generateWithImages(prompt, imageDataUrls.filter((url) => typeof url === "string" && url.startsWith("data:image/")).slice(0, 3), 0)
        : await generate(prompt, 0);
    return parseJsonObject<T>(raw);
  } catch (error) {
    console.warn("[resume-intelligence] AI request failed:", error);
    return null;
  }
}

export async function extractResumeStructure(input: {
  resumeText?: string;
  images?: string[];
  useAi?: boolean;
}): Promise<ParsedResume> {
  const useAi = input.useAi ?? Boolean(process.env.GEMINI_API_KEY);
  const text = normalizeExtractedText(input.resumeText ?? "");
  const fallback = parseResume(text);

  if (!useAi) {
    return fallback;
  }

  const images = (input.images ?? [])
    .filter((image): image is string => typeof image === "string" && image.startsWith("data:image/"))
    .slice(0, 3);

  const prompt = [
    "You extract a resume into strict JSON.",
    "Return ONLY valid JSON with this exact shape:",
    "{",
    '  "personalInfo": { "fullName": "", "email": "", "phone": "", "location": "", "linkedin": "", "website": "", "jobTitle": "" },',
    '  "summary": "",',
    '  "workExperience": [ { "company": "", "title": "", "location": "", "startDate": "", "endDate": "", "bullets": [] } ],',
    '  "education": [ { "institution": "", "degree": "", "field": "", "startDate": "", "endDate": "", "gpa": "", "honors": "" } ],',
    '  "skills": [],',
    '  "certifications": [ { "name": "", "issuer": "", "date": "", "credentialId": "", "validFrom": "", "validTo": "", "neverExpires": false } ],',
    '  "targetRole": ""',
    "}",
    "Rules:",
    "- Use only information explicitly visible in the resume.",
    "- Prefer the visual layout over raw line order when the document is multi-column.",
    "- Keep fields empty when missing.",
    "- Do not invent employers, degrees, dates, or skills.",
    "- Preserve the original order of experience and education entries.",
    "- For workExperience.bullets, capture only the bullet points that belong to that role.",
    "- Normalize linkedin to a full URL when present.",
    "- Do not include markdown fences.",
    "Resume text:",
    text.slice(0, 14000) || "(No text extraction available. Parse from the resume images only.)",
  ].join("\n");

  const raw = await generateJson<AiResumeStructurePayload>(prompt, images);
  return mergeResumeStructure(fallback, raw);
}

function composeResumeText(source: ResumeSignalSource): string {
  const parts: string[] = [];

  const personalInfo = source.personalInfo ?? {};
  const fullName = source.targetRole ?? personalInfo.jobTitle ?? "";
  if (fullName) {
    parts.push(fullName);
  }

  if (source.summary) {
    parts.push(source.summary);
  }

  for (const experience of source.workExperience ?? []) {
    const lines = [experience.title, experience.company, experience.startDate, experience.endDate, experience.description]
      .map((item) => normalizeWhitespace(item ?? ""))
      .filter(Boolean);
    if (lines.length) {
      parts.push(lines.join(" "));
    }
  }

  for (const education of source.education ?? []) {
    const lines = [education.startDate, education.endDate].map((item) => normalizeWhitespace(item ?? "")).filter(Boolean);
    if (lines.length) {
      parts.push(lines.join(" "));
    }
  }

  if (source.skills?.length) {
    parts.push(source.skills.join(" "));
  }

  for (const certification of source.certifications ?? []) {
    const lines = [certification.name, certification.issuer, certification.date].map((item) => normalizeWhitespace(item ?? "")).filter(Boolean);
    if (lines.length) {
      parts.push(lines.join(" "));
    }
  }

  return normalizeWhitespace(parts.join(" \n "));
}

function htmlToPlainText(value: string): string {
  return value
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<br\s*\/?>(?=\s*)/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function htmlToBullets(value: string): string[] {
  return htmlToPlainText(value)
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s*-]+/, "").trim())
    .filter(Boolean);
}

function getExperienceAchievements(source: ResumeSignalSource): string[] {
  const achievements = source.workExperience
    ? source.workExperience.flatMap((experience) => htmlToBullets(experience.description ?? ""))
    : [];

  return dedupePreserveOrder(achievements);
}

function getSignalDates(source: ResumeSignalSource): string[] {
  const dates = [
    ...(source.workExperience ?? []).flatMap((experience) => [experience.startDate ?? "", experience.endDate ?? ""]),
    ...(source.education ?? []).flatMap((education) => [education.startDate ?? "", education.endDate ?? ""]),
    ...(source.certifications ?? []).map((certification) => certification.date ?? ""),
  ];

  return dedupePreserveOrder(dates.filter(Boolean));
}

function categorizeNormalizedSkills(skills: NormalizedSkill[]): ResumeSignalExtraction {
  const grouped = {
    skills: dedupePreserveOrder(skills.map((skill) => skill.canonicalName)),
    technologies: dedupePreserveOrder(
      skills.filter((skill) => skill.category === "technology" || skill.category === "platform" || skill.category === "database").map((skill) => skill.canonicalName)
    ),
    tools: dedupePreserveOrder(skills.filter((skill) => skill.category === "tool").map((skill) => skill.canonicalName)),
    frameworks: dedupePreserveOrder(skills.filter((skill) => skill.category === "framework").map((skill) => skill.canonicalName)),
    certifications: dedupePreserveOrder(skills.filter((skill) => skill.category === "certification").map((skill) => skill.canonicalName)),
    methodologies: dedupePreserveOrder(skills.filter((skill) => skill.category === "methodology").map((skill) => skill.canonicalName)),
    jobTitles: [] as string[],
    companies: [] as string[],
    achievements: [] as string[],
    dates: [] as string[],
  };

  return grouped;
}

async function normalizeSkillCollection(values: string[], useAi: boolean): Promise<NormalizedSkill[]> {
  const firstPass = normalizeSkillBatch(values);
  let skills = firstPass.skills;

  if (useAi && firstPass.unknownSkills.length > 0) {
    const suggestions = await suggestSkillTaxonomyEntries(firstPass.unknownSkills.slice(0, 12));
    if (suggestions.length > 0) {
      skills = normalizeSkillBatch(values, suggestions).skills;
    }
  }

  return skills;
}

async function suggestSkillTaxonomyEntries(values: string[]): Promise<SkillTaxonomyEntry[]> {
  if (values.length === 0 || !process.env.GEMINI_API_KEY) {
    return [];
  }

  const prompt = [
    "You normalize resume skill terms into a stable taxonomy.",
    "Return ONLY valid JSON with this exact shape:",
    "[",
    "  {",
    '    "canonicalName": "string",',
    '    "aliases": ["string"],',
    '    "category": "language|framework|tool|platform|technology|methodology|certification|soft-skill|database|other"',
    "  }",
    "]",
    "Rules:",
    "- Use the most recognized industry name as canonicalName.",
    "- Keep aliases short and synonymous.",
    "- Do not score or rank anything.",
    "- Only normalize these values:",
    values.map((value) => `- ${value}`).join("\n"),
  ].join("\n");

  const raw = await generateJson<unknown[]>(prompt);
  if (!Array.isArray(raw)) {
    return [];
  }

  const suggestions: SkillTaxonomyEntry[] = raw
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as {
        canonicalName?: unknown;
        aliases?: unknown;
        category?: unknown;
      };

      const canonicalName = typeof candidate.canonicalName === "string" ? normalizeWhitespace(candidate.canonicalName) : "";
      const aliases = toArrayOfStrings(candidate.aliases);
      const categoryValue = typeof candidate.category === "string" ? candidate.category : "other";
      const category = (
        ["language", "framework", "tool", "platform", "technology", "methodology", "certification", "soft-skill", "database", "other"].includes(categoryValue)
          ? categoryValue
          : "other"
      ) as SkillCategory;

      if (!canonicalName) {
        return null;
      }

      return {
        canonicalName,
        aliases,
        category,
      };
    })
    .filter((entry): entry is SkillTaxonomyEntry => Boolean(entry));

  return registerSkillTaxonomyEntries(suggestions);
}

function extractSkillArray(payload: AiSkillPayload | null): string[] {
  if (!payload) {
    return [];
  }

  return dedupePreserveOrder([
    ...toArrayOfStrings(payload.skills),
    ...toArrayOfStrings(payload.technologies),
    ...toArrayOfStrings(payload.tools),
    ...toArrayOfStrings(payload.frameworks),
    ...toArrayOfStrings(payload.certifications),
    ...toArrayOfStrings(payload.methodologies),
  ]);
}

function extractJobDescriptionSkillArray(payload: AiJobDescriptionPayload | null): string[] {
  if (!payload) {
    return [];
  }

  return dedupePreserveOrder([
    ...toArrayOfStrings(payload.requiredSkills),
    ...toArrayOfStrings(payload.preferredSkills),
    ...toArrayOfStrings(payload.tools),
    ...toArrayOfStrings(payload.frameworks),
    ...toArrayOfStrings(payload.certifications),
  ]);
}

function parseYearsExperience(text: string): number | null {
  const matches = [...text.matchAll(/(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)?/gi)];
  const values = matches
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value) && value > 0);

  return values.length > 0 ? Math.max(...values) : null;
}

function inferSeniority(text: string): JobSeniority {
  const normalized = text.toLowerCase();
  if (/\b(executive|vp|vice president|cxo|chief)\b/.test(normalized)) return "executive";
  if (/\b(director)\b/.test(normalized)) return "director";
  if (/\b(manager|management)\b/.test(normalized)) return "manager";
  if (/\b(principal|lead|staff)\b/.test(normalized)) return "lead";
  if (/\b(senior|sr\.)\b/.test(normalized)) return "senior";
  if (/\b(mid|intermediate)\b/.test(normalized)) return "mid";
  if (/\b(junior|jr\.|entry|associate)\b/.test(normalized)) return "junior";
  return /\b(intern|trainee)\b/.test(normalized) ? "entry" : "unknown";
}

function extractResponsibilities(text: string): string[] {
  const lines = text.split(/\r?\n/).map((line) => normalizeWhitespace(line)).filter(Boolean);
  const bullets = lines.filter((line) => /^[-*•·\d.)]/.test(line));
  const usable = bullets.length > 0 ? bullets : lines;

  return dedupePreserveOrder(
    usable
      .map((line) => line.replace(/^[\s*-•·\d.)]+/, "").trim())
      .filter((line) => line.length >= 20)
      .slice(0, 8)
  );
}

async function extractResumeSkillSignals(text: string, useAi: boolean): Promise<NormalizedSkill[]> {
  const deterministicSignals = findSkillsInText(text).map((skill) => skill.canonicalName);
  const aiPayload = useAi ? await generateJson<AiSkillPayload>([
    "Extract only skill-like terms from this resume.",
    "Return ONLY valid JSON with this exact shape:",
    '{"skills":[],"technologies":[],"tools":[],"frameworks":[],"certifications":[],"methodologies":[]}',
    "Rules:",
    "- Include only explicit skill terms from the text.",
    "- Do not return job titles, companies, dates, or achievements.",
    "- Do not score or rank anything.",
    "Resume text:",
    text.slice(0, 12000),
  ].join("\n")) : null;

  const candidateSkills = dedupePreserveOrder([...deterministicSignals, ...extractSkillArray(aiPayload)]);
  return normalizeSkillCollection(candidateSkills, useAi);
}

async function extractJobDescriptionSkillSignals(text: string, useAi: boolean): Promise<NormalizedSkill[]> {
  const fallbackSkills = findSkillsInText(text).map((skill) => skill.canonicalName);
  const aiPayload = useAi ? await generateJson<AiJobDescriptionPayload>([
    "Extract the skill requirements from this job description.",
    "Return ONLY valid JSON with this exact shape:",
    '{"requiredSkills":[],"preferredSkills":[],"tools":[],"frameworks":[],"certifications":[],"yearsExperience":null,"seniority":"unknown","responsibilities":[]}',
    "Rules:",
    "- Include only explicit requirements.",
    "- Do not score, rank, or recommend anything.",
    "Job description:",
    text.slice(0, 12000),
  ].join("\n")) : null;

  const candidateSkills = dedupePreserveOrder([...fallbackSkills, ...extractJobDescriptionSkillArray(aiPayload)]);
  return normalizeSkillCollection(candidateSkills, useAi);
}

function buildResumeSignalExtraction(source: ResumeSignalSource, normalizedSkills: NormalizedSkill[], textSource: string): ResumeSignalExtraction {
  const skills = categorizeNormalizedSkills(normalizedSkills);
  const jobTitles = dedupePreserveOrder([
    source.personalInfo?.jobTitle ?? "",
    source.targetRole ?? "",
    ...(source.workExperience ?? []).map((experience) => experience.title ?? ""),
  ]);
  const companies = dedupePreserveOrder((source.workExperience ?? []).map((experience) => experience.company ?? ""));
  const achievements = dedupePreserveOrder(getExperienceAchievements(source));
  const dates = getSignalDates(source);
  const certifications = dedupePreserveOrder([
    ...skills.certifications,
    ...(source.certifications ?? []).map((certification) => certification.name ?? ""),
  ]);

  return {
    skills: skills.skills,
    technologies: skills.technologies,
    tools: skills.tools,
    frameworks: skills.frameworks,
    certifications,
    methodologies: skills.methodologies,
    jobTitles,
    companies,
    achievements: dedupePreserveOrder(achievements.length > 0 ? achievements : extractResponsibilities(textSource)),
    dates,
  };
}

function scoreToDetail(score: number, explanation: string, evidence: string[]): ScoreDetail {
  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    explanation,
    evidence: dedupePreserveOrder(evidence).slice(0, 6),
  };
}

function buildStrengths(report: {
  matchedSkills: string[];
  deterministicAnalysis: AtsAnalysisResult;
  resumeSignals: ResumeSignalExtraction;
  atsCompatibilityScore: number;
  recruiterAppealScore: number;
}): string[] {
  const strengths: string[] = [];

  if (report.matchedSkills.length > 0) {
    strengths.push(`Matches ${report.matchedSkills.slice(0, 5).join(", ")} from the target role.`);
  }

  if (report.deterministicAnalysis.sections.missingSections.length === 0) {
    strengths.push("Resume structure covers the core ATS sections.");
  }

  if (report.deterministicAnalysis.qualityDetails.quantifiedAchievementCount > 0) {
    strengths.push("Shows measurable achievements in the experience section.");
  }

  if (report.deterministicAnalysis.experienceDetails.totalExperienceYears > 0) {
    strengths.push(
      `Detected ${report.deterministicAnalysis.experienceDetails.totalExperienceYears} years of experience across ${report.deterministicAnalysis.experienceDetails.positionCount} roles.`
    );
  }

  if (report.atsCompatibilityScore >= 80) {
    strengths.push("ATS compatibility is strong.");
  }

  if (report.recruiterAppealScore >= 75) {
    strengths.push("Presentation and impact read well for recruiters.");
  }

  return dedupePreserveOrder(strengths).slice(0, 5);
}

function buildWeaknesses(report: {
  missingSkills: string[];
  deterministicAnalysis: AtsAnalysisResult;
  atsCompatibilityScore: number;
  recruiterAppealScore: number;
}): string[] {
  const weaknesses: string[] = [];

  if (report.missingSkills.length > 0) {
    weaknesses.push(`Missing key skills: ${report.missingSkills.slice(0, 5).join(", ")}.`);
  }

  if (report.deterministicAnalysis.sections.missingSections.length > 0) {
    weaknesses.push(`Missing resume sections: ${report.deterministicAnalysis.sections.missingSections.join(", ")}.`);
  }

  if (report.deterministicAnalysis.qualityDetails.actionVerbCount < report.deterministicAnalysis.qualityDetails.bulletCount) {
    weaknesses.push("Some bullets could use stronger action verbs and clearer outcomes.");
  }

  if (report.atsCompatibilityScore < 65) {
    weaknesses.push("ATS structure and formatting signals are weaker than ideal.");
  }

  if (report.recruiterAppealScore < 65) {
    weaknesses.push("Recruiter appeal could improve with more quantified impact.");
  }

  return dedupePreserveOrder(weaknesses).slice(0, 5);
}

function buildScoreBreakdown(report: {
  overallScore: number;
  atsCompatibilityScore: number;
  jobMatchScore: number;
  recruiterAppealScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  resumeSignals: ResumeSignalExtraction;
  jobDescriptionSignals: JobDescriptionSignalExtraction;
  deterministicAnalysis: AtsAnalysisResult;
}): ResumeIntelligenceReport["scoreBreakdown"] {
  const contactScore = Math.round((report.deterministicAnalysis.contactDetails.points / 8) * 100);
  const quantifiedImpactScore = report.deterministicAnalysis.qualityDetails.quantifiedScore;

  return {
    overall: scoreToDetail(
      report.overallScore,
      "Weighted blend of job match, ATS compatibility, and recruiter appeal.",
      [
        `Job match: ${report.jobMatchScore}`,
        `ATS compatibility: ${report.atsCompatibilityScore}`,
        `Recruiter appeal: ${report.recruiterAppealScore}`,
      ]
    ),
    atsCompatibility: scoreToDetail(
      report.atsCompatibilityScore,
      "Combines section coverage, resume quality, and contact completeness.",
      [
        `Section score: ${report.deterministicAnalysis.sectionScore}`,
        `Quality score: ${report.deterministicAnalysis.qualityScore}`,
        `Contact score: ${contactScore}`,
        `Missing sections: ${report.deterministicAnalysis.sections.missingSections.join(", ") || "none"}`,
      ]
    ),
    jobMatch: scoreToDetail(
      report.jobMatchScore,
      "Measures how well the resume matches the extracted job requirements.",
      [
        `Matched skills: ${report.matchedSkills.join(", ") || "none"}`,
        `Missing skills: ${report.missingSkills.join(", ") || "none"}`,
        `Keyword score: ${report.deterministicAnalysis.keywordScore}`,
      ]
    ),
    recruiterAppeal: scoreToDetail(
      report.recruiterAppealScore,
      "Estimates how compelling the resume reads to a recruiter.",
      [
        `Experience score: ${report.deterministicAnalysis.experienceScore}`,
        `Quality score: ${report.deterministicAnalysis.qualityScore}`,
        `Quantified achievements: ${quantifiedImpactScore}`,
      ]
    ),
    skillCoverage: scoreToDetail(
      report.matchedSkills.length === 0 && report.missingSkills.length === 0
        ? 100
        : Math.round((report.matchedSkills.length / Math.max(1, report.matchedSkills.length + report.missingSkills.length)) * 100),
      "Shows how much of the normalized job skill set appears on the resume.",
      [
        `Matched ${report.matchedSkills.length} normalized job skills.`,
        `Missing ${report.missingSkills.length} normalized job skills.`,
      ]
    ),
    experienceAlignment: scoreToDetail(
      report.deterministicAnalysis.experienceScore,
      report.deterministicAnalysis.experienceDetails.explanation,
      [
        `Years detected: ${report.deterministicAnalysis.experienceDetails.totalExperienceYears}`,
        `Required years: ${report.deterministicAnalysis.experienceDetails.requiredYears ?? "not specified"}`,
      ]
    ),
    achievementImpact: scoreToDetail(
      report.deterministicAnalysis.qualityDetails.quantifiedScore,
      "Captures whether the resume shows measurable impact and results.",
      [
        `Quantified bullets: ${report.deterministicAnalysis.qualityDetails.quantifiedAchievementCount}`,
        `Action-verb bullets: ${report.deterministicAnalysis.qualityDetails.actionVerbCount}`,
      ]
    ),
  };
}

export async function extractResumeSignals(input: {
  resumeText?: string;
  resumeData?: ResumeSignalSource;
  useAi?: boolean;
}): Promise<ResumeSignalExtraction> {
  const useAi = input.useAi ?? Boolean(process.env.GEMINI_API_KEY);
  const source = input.resumeData ?? (input.resumeText ? parseResume(input.resumeText) : null);
  if (!source && !input.resumeText) {
    return {
      skills: [],
      technologies: [],
      tools: [],
      frameworks: [],
      certifications: [],
      methodologies: [],
      jobTitles: [],
      companies: [],
      achievements: [],
      dates: [],
    };
  }

  const textSource = normalizeWhitespace(input.resumeText ?? composeResumeText(source ?? {}));
  const normalizedSkills = await extractResumeSkillSignals(textSource, useAi);
  const signalSource = source ?? parseResume(textSource);

  return buildResumeSignalExtraction(signalSource, normalizedSkills, textSource);
}

export async function extractJobDescriptionSignals(jobDescription: string, options?: { useAi?: boolean }): Promise<JobDescriptionSignalExtraction> {
  const useAi = options?.useAi ?? Boolean(process.env.GEMINI_API_KEY);
  const text = normalizeWhitespace(jobDescription);
  if (!text) {
    return {
      requiredSkills: [],
      preferredSkills: [],
      tools: [],
      frameworks: [],
      certifications: [],
      yearsExperience: null,
      seniority: "unknown",
      responsibilities: [],
    };
  }

  const fallbackSkills = await extractJobDescriptionSkillSignals(text, useAi);
  const aiPayload = useAi
    ? await generateJson<AiJobDescriptionPayload>([
        "Parse this job description into structured requirements.",
        "Return ONLY valid JSON with this exact shape:",
        '{"requiredSkills":[],"preferredSkills":[],"tools":[],"frameworks":[],"certifications":[],"yearsExperience":null,"seniority":"unknown","responsibilities":[]}',
        "Rules:",
        "- Extract only explicit information from the text.",
        "- Do not score or rank candidates.",
        "- Keep responsibilities as concise action statements.",
        "Job description:",
        text.slice(0, 12000),
      ].join("\n"))
    : null;

  const requiredSkills = await normalizeSkillNames([
    ...fallbackSkills.map((skill) => skill.canonicalName),
    ...toArrayOfStrings(aiPayload?.requiredSkills),
  ], []);
  const preferredSkills = await normalizeSkillNames(toArrayOfStrings(aiPayload?.preferredSkills), []);
  const tools = await normalizeSkillNames([
    ...fallbackSkills.filter((skill) => skill.category === "tool" || skill.category === "platform").map((skill) => skill.canonicalName),
    ...toArrayOfStrings(aiPayload?.tools),
  ]);
  const frameworks = await normalizeSkillNames([
    ...fallbackSkills.filter((skill) => skill.category === "framework").map((skill) => skill.canonicalName),
    ...toArrayOfStrings(aiPayload?.frameworks),
  ]);
  const certifications = await normalizeSkillNames([
    ...fallbackSkills.filter((skill) => skill.category === "certification").map((skill) => skill.canonicalName),
    ...toArrayOfStrings(aiPayload?.certifications),
  ]);

  return {
    requiredSkills: dedupePreserveOrder(requiredSkills),
    preferredSkills: dedupePreserveOrder(preferredSkills),
    tools: dedupePreserveOrder(tools),
    frameworks: dedupePreserveOrder(frameworks),
    certifications: dedupePreserveOrder(certifications),
    yearsExperience:
      typeof aiPayload?.yearsExperience === "number"
        ? aiPayload.yearsExperience
        : parseYearsExperience(text),
    seniority:
      typeof aiPayload?.seniority === "string" && aiPayload.seniority !== "unknown"
        ? (aiPayload.seniority as JobSeniority)
        : inferSeniority(text),
    responsibilities: dedupePreserveOrder([
      ...toArrayOfStrings(aiPayload?.responsibilities),
      ...extractResponsibilities(text),
    ]),
  };
}

function buildScoringResumeData(input: Partial<ResumeData> | undefined, resumeSignals: ResumeSignalExtraction): Partial<ResumeData> | undefined {
  if (!input) {
    return undefined;
  }

  return {
    ...input,
    skills: dedupePreserveOrder([...(input.skills ?? []), ...resumeSignals.skills]),
  };
}

function buildJobSkillSet(jobSignals: JobDescriptionSignalExtraction): string[] {
  return dedupePreserveOrder([
    ...jobSignals.requiredSkills,
    ...jobSignals.preferredSkills,
    ...jobSignals.tools,
    ...jobSignals.frameworks,
    ...jobSignals.certifications,
  ]);
}

function intersectSkills(resumeSkills: string[], jobSkills: string[]): string[] {
  const resumeSet = new Set(resumeSkills.map((skill) => skill.toLowerCase()));
  return jobSkills.filter((skill) => resumeSet.has(skill.toLowerCase()));
}

function differenceSkills(resumeSkills: string[], jobSkills: string[]): string[] {
  const resumeSet = new Set(resumeSkills.map((skill) => skill.toLowerCase()));
  return jobSkills.filter((skill) => !resumeSet.has(skill.toLowerCase()));
}

function scoreJobMatch(jobSignals: JobDescriptionSignalExtraction, matchedSkills: string[], analysis: AtsAnalysisResult): number {
  const requiredMatch = jobSignals.requiredSkills.length > 0
    ? Math.round((intersectSkills(matchedSkills, jobSignals.requiredSkills).length / Math.max(1, jobSignals.requiredSkills.length)) * 100)
    : analysis.keywordScore;
  const preferredMatch = jobSignals.preferredSkills.length > 0
    ? Math.round((intersectSkills(matchedSkills, jobSignals.preferredSkills).length / Math.max(1, jobSignals.preferredSkills.length)) * 100)
    : analysis.keywordScore;
  const skillWeight = jobSignals.requiredSkills.length > 0 || jobSignals.preferredSkills.length > 0 ? Math.round(requiredMatch * 0.7 + preferredMatch * 0.3) : analysis.keywordScore;
  return Math.max(0, Math.min(100, skillWeight));
}

function scoreAtsCompatibility(analysis: AtsAnalysisResult): number {
  const contactScore = Math.round((analysis.contactDetails.points / 8) * 100);
  return Math.max(0, Math.min(100, Math.round(analysis.sectionScore * 0.45 + analysis.qualityScore * 0.35 + contactScore * 0.2)));
}

function scoreRecruiterAppeal(analysis: AtsAnalysisResult): number {
  return Math.max(0, Math.min(100, Math.round(analysis.qualityScore * 0.4 + analysis.experienceScore * 0.35 + analysis.qualityDetails.quantifiedScore * 0.25)));
}

export async function buildResumeIntelligenceReport(input: {
  resumeData?: Partial<ResumeData>;
  resumeText?: string;
  jobDescription: string;
  useAi?: boolean;
}): Promise<ResumeIntelligenceReport> {
  const useAi = input.useAi ?? Boolean(process.env.GEMINI_API_KEY);
  const resumeTextSource = normalizeWhitespace(input.resumeText ?? composeResumeText(input.resumeData ?? {}));

  const [resumeSignals, jobDescriptionSignals] = await Promise.all([
    extractResumeSignals({ resumeText: resumeTextSource, resumeData: input.resumeData, useAi }),
    extractJobDescriptionSignals(input.jobDescription, { useAi }),
  ]);

  const scoringResumeData = buildScoringResumeData(input.resumeData, resumeSignals);
  const deterministicAnalysis = defaultAtsScoringService.analyze(
    scoringResumeData
      ? { resumeData: scoringResumeData, jobDescription: input.jobDescription }
      : { resumeText: resumeTextSource, jobDescription: input.jobDescription }
  );

  const resumeSkillSet = dedupePreserveOrder(resumeSignals.skills);
  const jobSkillSet = buildJobSkillSet(jobDescriptionSignals);
  const matchedSkills = intersectSkills(resumeSkillSet, jobSkillSet);
  const missingSkills = differenceSkills(resumeSkillSet, jobSkillSet);

  const jobMatchScore = scoreJobMatch(jobDescriptionSignals, matchedSkills, deterministicAnalysis);
  const atsCompatibilityScore = scoreAtsCompatibility(deterministicAnalysis);
  const recruiterAppealScore = scoreRecruiterAppeal(deterministicAnalysis);
  const overallScore = Math.max(0, Math.min(100, Math.round(jobMatchScore * 0.45 + atsCompatibilityScore * 0.3 + recruiterAppealScore * 0.25)));

  const report: ResumeIntelligenceReport = {
    resumeSignals,
    jobDescriptionSignals,
    overallScore,
    atsCompatibilityScore,
    jobMatchScore,
    recruiterAppealScore,
    matchedSkills,
    missingSkills,
    strengths: buildStrengths({
      matchedSkills,
      deterministicAnalysis,
      resumeSignals,
      atsCompatibilityScore,
      recruiterAppealScore,
    }),
    weaknesses: buildWeaknesses({
      missingSkills,
      deterministicAnalysis,
      atsCompatibilityScore,
      recruiterAppealScore,
    }),
    recommendations: dedupePreserveOrder([
      ...deterministicAnalysis.recommendations,
      ...(missingSkills.length > 0 ? [`Work these missing skills into the resume where they are accurate: ${missingSkills.slice(0, 6).join(", ")}.`] : []),
      ...(jobDescriptionSignals.requiredSkills.length > 0 ? [`Emphasize the strongest matches for: ${jobDescriptionSignals.requiredSkills.slice(0, 5).join(", ")}.`] : []),
    ]).slice(0, 10),
    scoreBreakdown: buildScoreBreakdown({
      overallScore,
      atsCompatibilityScore,
      jobMatchScore,
      recruiterAppealScore,
      matchedSkills,
      missingSkills,
      resumeSignals,
      jobDescriptionSignals,
      deterministicAnalysis,
    }),
    deterministicAnalysis,
  };

  return report;
}

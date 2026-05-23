import type { ResumeData, WorkExperience } from "@/types/resume";
import { atsConfig, type AtsConfig, type AtsSectionKey } from "@/config/ats.config";

export type AtsInput = string | Partial<ResumeData>;

export type AtsGapCategory =
  | "Technical Skill"
  | "Soft Skill"
  | "Tool/Platform"
  | "Certification"
  | "Domain Knowledge"
  | "Experience";

export interface AtsContactInfo {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  website: string | null;
  location: string | null;
}

export interface ParsedDatePart {
  year: number;
  month: number;
  isCurrent: boolean;
}

export interface ParsedDateRange {
  rawStart: string;
  rawEnd: string;
  start: ParsedDatePart | null;
  end: ParsedDatePart | null;
  months: number;
  years: number;
}

export interface ParsedExperienceEntry {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  bullets: string[];
  startDate: string;
  endDate: string;
  range: ParsedDateRange | null;
}

export interface ParsedResume {
  sourceType: "text" | "structured";
  fullText: string;
  normalizedText: string;
  wordCount: number;
  bulletPoints: string[];
  contact: AtsContactInfo;
  sections: Record<AtsSectionKey, boolean>;
  summary: string;
  skills: string[];
  workExperience: ParsedExperienceEntry[];
  education: string[];
  certifications: string[];
  projects: string[];
  experiencePeriods: ParsedDateRange[];
}

export interface KeywordMatchResult {
  requiredKeywords: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  score: number;
  matchRatio: number;
  keywordSignals: Array<{
    keyword: string;
    source: "dictionary" | "phrase";
    score: number;
  }>;
}

export interface SectionAnalysisResult {
  score: number;
  pointsEarned: number;
  maxPoints: number;
  detectedSections: string[];
  missingSections: string[];
  presentMap: Record<AtsSectionKey, boolean>;
}

export interface ExperienceAnalysisResult {
  totalExperienceMonths: number;
  totalExperienceYears: number;
  positionCount: number;
  requiredYears: number | null;
  requirementMet: boolean | null;
  yearsGap: number | null;
  score: number;
  explanation: string;
  periods: ParsedDateRange[];
}

export interface QualityAnalysisResult {
  score: number;
  wordCount: number;
  bulletCount: number;
  actionVerbCount: number;
  quantifiedAchievementCount: number;
  averageWordsPerBullet: number;
  wordCountScore: number;
  bulletScore: number;
  actionVerbScore: number;
  quantifiedScore: number;
  explanation: string;
}

export interface ContactAnalysisResult {
  email: boolean;
  phone: boolean;
  linkedin: boolean;
  points: number;
  missing: string[];
}

export interface AtsScoreBreakdown {
  keyword: KeywordMatchResult;
  section: SectionAnalysisResult;
  experience: ExperienceAnalysisResult;
  quality: QualityAnalysisResult;
  contact: ContactAnalysisResult;
  weights: AtsConfig["weights"];
  overallBeforeRounding: number;
}

export interface AtsAnalysisResult {
  atsScore: number;
  keywordScore: number;
  sectionScore: number;
  experienceScore: number;
  qualityScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  issues: string[];
  recommendations: string[];
  analysisSummary: string;
  scoreBreakdown: AtsScoreBreakdown;
  sections: SectionAnalysisResult;
  keywordDetails: KeywordMatchResult;
  experienceDetails: ExperienceAnalysisResult;
  qualityDetails: QualityAnalysisResult;
  contactDetails: ContactAnalysisResult;
}

export interface AtsOptimizationResult {
  summary: string;
  workExperience: Array<{ id: string; description: string }>;
  additionalSkills: string[];
  atsScore: number;
  analysis: AtsAnalysisResult;
}

export interface AtsGapLearningResource {
  title: string;
  type: "course" | "video" | "docs" | "book" | "practice";
  platform: string;
  searchQuery: string;
}

export interface AtsGapInsight {
  id: string;
  category: AtsGapCategory;
  item: string;
  importance: "high" | "medium" | "low";
  context: string;
  learningResources: AtsGapLearningResource[];
}

const SECTION_ORDER: AtsSectionKey[] = [
  "summary",
  "skills",
  "experience",
  "education",
  "projects",
  "certifications",
];

const ANALYSIS_REFERENCE_DATE = new Date(atsConfig.analysisReferenceDateIso);

function buildEmptySectionMap(): Record<AtsSectionKey, boolean> {
  return {
    summary: false,
    skills: false,
    experience: false,
    education: false,
    projects: false,
    certifications: false,
  };
}

function buildEmptyStringMap(): Record<AtsSectionKey, string[]> {
  return {
    summary: [],
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripAccents(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function stripHtml(value: string): string {
  return decodeHtmlEntities(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/section>/gi, "\n")
      .replace(/<\/article>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<li[^>]*>/gi, "- ")
      .replace(/<[^>]+>/g, " ")
  );
}

function htmlToPlainText(html: string): string {
  return normalizeWhitespace(stripHtml(html).replace(/\r/g, " "));
}

function normalizeForMatch(value: string): string {
  return normalizeWhitespace(stripAccents(value.toLowerCase().replace(/[^a-z0-9+/#.\-\s]/g, " ")));
}

function normalizeSectionHeader(value: string): string {
  return normalizeWhitespace(
    stripAccents(value.toLowerCase().replace(/[^a-z0-9+/#.\s]/g, " "))
  );
}

function tokenizeWords(value: string): string[] {
  const matches = normalizeForMatch(value).match(/[a-z0-9+#/.\-]+/g);
  return matches ? matches.filter(Boolean) : [];
}

function dedupePreserveOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(value);
  }
  return result;
}

function titleCaseKeyword(value: string): string {
  if (!value) {
    return value;
  }

  const words = value.split(/\s+/).filter(Boolean);
  const transformed = words.map((word) => {
    const lower = word.toLowerCase();
    if (/^[a-z]{1,3}$/.test(lower) && word.length <= 3) {
      return lower.toUpperCase();
    }
    if (/^[a-z0-9+/.-]+$/.test(lower) && lower.includes("/")) {
      return word.toUpperCase();
    }
    if (/^[a-z]{2,4}\d+$/.test(lower)) {
      return word.toUpperCase();
    }
    if (/^[a-z0-9+#.-]+$/.test(lower) && word === word.toUpperCase()) {
      return word;
    }
    if (/^([a-z]+\.[a-z]+)$/.test(lower)) {
      return word;
    }
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });
  return transformed.join(" ");
}

function joinList(values: string[]): string {
  if (values.length === 0) {
    return "";
  }
  if (values.length === 1) {
    return values[0];
  }
  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }
  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
}

function countWords(value: string): number {
  return tokenizeWords(value).length;
}

function isLikelyNoiseWord(value: string): boolean {
  const normalized = value.toLowerCase();
  return atsConfig.noiseWords.some((noise) => {
    const normalizedNoise = noise.toLowerCase();
    return normalized === normalizedNoise || new RegExp(`\\b${escapeRegExp(normalizedNoise)}\\b`, "i").test(normalized);
  });
}

function isLikelyStopWord(value: string): boolean {
  return atsConfig.stopWords.includes(value.toLowerCase());
}

function isSectionHeaderLine(line: string): AtsSectionKey | null {
  const normalized = normalizeSectionHeader(line.replace(/[:\-]\s*$/, ""));
  for (const section of SECTION_ORDER) {
    for (const alias of atsConfig.sectionAliases[section]) {
      if (normalized === normalizeSectionHeader(alias)) {
        return section;
      }
    }
  }
  return null;
}

function decodeBulletLine(line: string): string {
  return normalizeWhitespace(
    line
      .replace(/^[\s>*-–—•·●▪○]+/, "")
      .replace(/^\d+[.)]\s+/, "")
      .replace(/\s+\u2022\s+/g, " ")
  );
}

function splitBulletsAndSentences(text: string): string[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const bullets: string[] = [];

  for (const line of lines) {
    if (/^[\s>*-–—•·●▪○]+/.test(line) || /^\d+[.)]\s+/.test(line)) {
      const decoded = decodeBulletLine(line);
      if (decoded) {
        bullets.push(decoded);
      }
      continue;
    }

    if (line.includes("•") || line.includes("·")) {
      for (const fragment of line.split(/[•·]/g)) {
        const decoded = decodeBulletLine(fragment);
        if (decoded) {
          bullets.push(decoded);
        }
      }
    }
  }

  if (bullets.length > 0) {
    return dedupePreserveOrder(bullets);
  }

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => normalizeWhitespace(sentence.replace(/^[-*•·●▪○\s]+/, "")))
    .filter((sentence) => sentence.length > 0);

  return dedupePreserveOrder(sentences);
}

function htmlToBulletLines(html: string): string[] {
  const plainText = htmlToPlainText(html);
  return splitBulletsAndSentences(plainText);
}

function textToBulletLines(value: string): string[] {
  return splitBulletsAndSentences(value);
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeOptionalString(value: unknown): string | undefined {
  const normalized = normalizeString(value).trim();
  return normalized ? normalized : undefined;
}

function normalizeResumeData(input: Partial<ResumeData> | null | undefined): ResumeData {
  const resumeData = input ?? {};
  const personalInfo = (resumeData.personalInfo ?? {}) as Partial<ResumeData["personalInfo"]>;

  return {
    personalInfo: {
      fullName: normalizeString(personalInfo.fullName),
      email: normalizeString(personalInfo.email),
      phone: normalizeString(personalInfo.phone),
      location: normalizeString(personalInfo.location),
      linkedin: normalizeOptionalString(personalInfo.linkedin),
      website: normalizeOptionalString(personalInfo.website),
      jobTitle: normalizeOptionalString(personalInfo.jobTitle),
    },
    targetRole: normalizeString(resumeData.targetRole),
    jobDescription: normalizeOptionalString(resumeData.jobDescription),
    summary: normalizeString(resumeData.summary),
    workExperience: Array.isArray(resumeData.workExperience)
      ? resumeData.workExperience.map((experience, index) => {
          const item = (experience ?? {}) as Partial<WorkExperience>;
          return {
            id: normalizeString(item.id) || `experience-${index + 1}`,
            company: normalizeString(item.company),
            title: normalizeString(item.title),
            location: normalizeOptionalString(item.location),
            startDate: normalizeString(item.startDate),
            endDate: normalizeString(item.endDate),
            description: normalizeString(item.description),
          };
        })
      : [],
    education: Array.isArray(resumeData.education)
      ? resumeData.education.map((education, index) => {
          const item = (education ?? {}) as Partial<ResumeData["education"][number]>;
          return {
            id: normalizeString(item.id) || `education-${index + 1}`,
            institution: normalizeString(item.institution),
            degree: normalizeString(item.degree),
            field: normalizeString(item.field),
            startDate: normalizeString(item.startDate),
            endDate: normalizeString(item.endDate),
            gpa: normalizeOptionalString(item.gpa),
            honors: normalizeOptionalString(item.honors),
          };
        })
      : [],
    skills: Array.isArray(resumeData.skills)
      ? resumeData.skills.map((skill) => normalizeString(skill)).filter(Boolean)
      : [],
    certifications: Array.isArray(resumeData.certifications)
      ? resumeData.certifications.map((certification, index) => {
          const item = (certification ?? {}) as Partial<ResumeData["certifications"][number]>;
          return {
            id: normalizeString(item.id) || `certification-${index + 1}`,
            name: normalizeString(item.name),
            issuer: normalizeString(item.issuer),
            date: normalizeString(item.date),
            credentialId: normalizeOptionalString(item.credentialId),
            validFrom: normalizeOptionalString(item.validFrom),
            validTo: normalizeOptionalString(item.validTo),
            neverExpires: Boolean(item.neverExpires),
          };
        })
      : [],
  };
}

function parseContactInfo(value: string, fullName: string | null = null): AtsContactInfo {
  const email = value.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0] ?? null;
  const phone = value.match(/(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/)?.[0] ?? null;
  const linkedin = value.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[A-Za-z0-9\-_.\/]+/i)?.[0] ?? null;
  const website = value.match(/(?:https?:\/\/)?(?:www\.)?[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?:\/[A-Za-z0-9\-_.?&=/%]*)?/i)?.[0] ?? null;
  const location = value.match(/\b[A-Z][A-Za-z]+,\s*[A-Z]{2}\b/)?.[0] ?? null;

  return {
    fullName,
    email,
    phone,
    linkedin,
    website,
    location,
  };
}

function parseMonthToken(value: string): number | null {
  const normalized = value.toLowerCase();
  const lookup: Record<string, number> = {
    jan: 1,
    january: 1,
    feb: 2,
    february: 2,
    mar: 3,
    march: 3,
    apr: 4,
    april: 4,
    may: 5,
    jun: 6,
    june: 6,
    jul: 7,
    july: 7,
    aug: 8,
    august: 8,
    sep: 9,
    sept: 9,
    september: 9,
    oct: 10,
    october: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12,
  };

  if (lookup[normalized] !== undefined) {
    return lookup[normalized];
  }

  return null;
}

function parseDatePart(value: string, isStart: boolean): ParsedDatePart | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const presentLike = /^(present|current|now)$/i.test(trimmed);
  if (presentLike) {
    return {
      year: ANALYSIS_REFERENCE_DATE.getUTCFullYear(),
      month: ANALYSIS_REFERENCE_DATE.getUTCMonth() + 1,
      isCurrent: true,
    };
  }

  const monthYearMatch = trimmed.match(/^([A-Za-z]{3,9})\.?\s+(\d{4})$/);
  if (monthYearMatch) {
    const month = parseMonthToken(monthYearMatch[1]);
    if (month) {
      return {
        year: Number(monthYearMatch[2]),
        month,
        isCurrent: false,
      };
    }
  }

  const numericMonthYearMatch = trimmed.match(/^(\d{1,2})[\/-](\d{4})$/);
  if (numericMonthYearMatch) {
    const month = Number(numericMonthYearMatch[1]);
    if (month >= 1 && month <= 12) {
      return {
        year: Number(numericMonthYearMatch[2]),
        month,
        isCurrent: false,
      };
    }
  }

  const yearMonthMatch = trimmed.match(/^(\d{4})[\/-](\d{1,2})$/);
  if (yearMonthMatch) {
    const month = Number(yearMonthMatch[2]);
    if (month >= 1 && month <= 12) {
      return {
        year: Number(yearMonthMatch[1]),
        month,
        isCurrent: false,
      };
    }
  }

  const yearOnlyMatch = trimmed.match(/^(\d{4})$/);
  if (yearOnlyMatch) {
    return {
      year: Number(yearOnlyMatch[1]),
      month: isStart ? 1 : 12,
      isCurrent: false,
    };
  }

  const fullDateMatch = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (fullDateMatch) {
    return {
      year: Number(fullDateMatch[3]),
      month: Number(fullDateMatch[1]),
      isCurrent: false,
    };
  }

  return null;
}

function toMonthIndex(part: ParsedDatePart): number {
  return part.year * 12 + (part.month - 1);
}

function buildDateRange(rawStart: string, rawEnd: string): ParsedDateRange | null {
  const start = parseDatePart(rawStart, true);
  const end = parseDatePart(rawEnd, false);
  if (!start || !end) {
    return null;
  }

  const startIndex = toMonthIndex(start);
  const endIndex = toMonthIndex(end);
  const months = Math.max(0, endIndex - startIndex + 1);

  return {
    rawStart,
    rawEnd,
    start,
    end,
    months,
    years: Number((months / 12).toFixed(1)),
  };
}

function parseDateRangesFromText(value: string): ParsedDateRange[] {
  const ranges: ParsedDateRange[] = [];
  const pattern = /([A-Za-z]{3,9}\.?(?:\s+\d{4})?|\d{1,2}[\/-]\d{4}|\d{4})\s*[-–—]\s*([A-Za-z]{3,9}\.?(?:\s+\d{4})?|\d{1,2}[\/-]\d{4}|\d{4}|present|current|now)/gi;

  for (const match of value.matchAll(pattern)) {
    const rawStart = match[1].trim();
    const rawEnd = match[2].trim();
    const range = buildDateRange(rawStart, rawEnd);
    if (range) {
      ranges.push(range);
    }
  }

  return ranges;
}

function mergeDateRanges(ranges: ParsedDateRange[]): ParsedDateRange[] {
  if (ranges.length <= 1) {
    return ranges;
  }

  const sorted = [...ranges].sort((left, right) => {
    const leftStart = left.start ? toMonthIndex(left.start) : 0;
    const rightStart = right.start ? toMonthIndex(right.start) : 0;
    return leftStart - rightStart;
  });

  const merged: ParsedDateRange[] = [];

  for (const range of sorted) {
    if (!range.start || !range.end) {
      continue;
    }

    const currentStart = toMonthIndex(range.start);
    const currentEnd = toMonthIndex(range.end);
    const previous = merged[merged.length - 1];

    if (!previous || !previous.start || !previous.end) {
      merged.push({ ...range });
      continue;
    }

    const previousStart = toMonthIndex(previous.start);
    const previousEnd = toMonthIndex(previous.end);
    if (currentStart <= previousEnd + 1) {
      const newEnd = currentEnd > previousEnd ? range.end : previous.end;
      merged[merged.length - 1] = {
        ...previous,
        rawEnd: newEnd === range.end ? range.rawEnd : previous.rawEnd,
        end: newEnd,
        months: Math.max(previous.months, currentEnd - previousStart + 1),
        years: Number((Math.max(previous.months, currentEnd - previousStart + 1) / 12).toFixed(1)),
      };
      continue;
    }

    merged.push({ ...range });
  }

  return merged;
}

function sumDateRanges(ranges: ParsedDateRange[]): number {
  return ranges.reduce((total, range) => total + range.months, 0);
}

function parseRequiredYears(jobDescription: string): number | null {
  const matches = [...jobDescription.matchAll(/(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/gi)];
  if (matches.length === 0) {
    return null;
  }

  const values = matches
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (values.length === 0) {
    return null;
  }

  return Math.max(...values);
}

function scoreWordCount(wordCount: number): number {
  const { idealWordCountMin, idealWordCountMax, shortWordCountThreshold, longWordCountThreshold } = atsConfig.quality;

  if (wordCount === 0) {
    return 0;
  }

  if (wordCount < idealWordCountMin) {
    return Math.max(20, Math.round((wordCount / Math.max(1, idealWordCountMin)) * 100));
  }

  if (wordCount <= idealWordCountMax) {
    return 100;
  }

  if (wordCount <= longWordCountThreshold) {
    const overage = wordCount - idealWordCountMax;
    const range = Math.max(1, longWordCountThreshold - idealWordCountMax);
    return Math.max(75, Math.round(100 - (overage / range) * 25));
  }

  const overage = wordCount - longWordCountThreshold;
  return Math.max(30, Math.round(75 - (overage / Math.max(1, shortWordCountThreshold)) * 10));
}

function scoreBulletCount(bulletCount: number, averageWordsPerBullet: number): number {
  if (bulletCount === 0) {
    return 0;
  }

  const countScore =
    bulletCount < 3
      ? 40
      : bulletCount < 6
      ? 70
      : bulletCount <= atsConfig.quality.maxBulletPoints
      ? 100
      : 85;

  const lengthScore =
    averageWordsPerBullet < 6
      ? 35
      : averageWordsPerBullet < 12
      ? 70
      : averageWordsPerBullet <= 24
      ? 100
      : 85;

  return Math.round(countScore * 0.55 + lengthScore * 0.45);
}

function scoreActionVerbs(actionVerbCount: number, bulletCount: number): number {
  if (bulletCount === 0 || actionVerbCount === 0) {
    return 0;
  }

  const ratio = Math.min(1, actionVerbCount / Math.max(1, atsConfig.quality.idealActionVerbs));
  return Math.round(ratio * 100);
}

function scoreQuantifiedAchievements(quantifiedAchievementCount: number, bulletCount: number): number {
  if (bulletCount === 0 || quantifiedAchievementCount === 0) {
    return 0;
  }

  const ratio = Math.min(1, quantifiedAchievementCount / Math.max(1, atsConfig.quality.idealQuantifiedAchievements));
  return Math.round(ratio * 100);
}

function detectActionVerbBullets(bullets: string[]): string[] {
  const verbs = atsConfig.actionVerbs.map((verb) => verb.toLowerCase());
  const matches: string[] = [];

  for (const bullet of bullets) {
    const normalized = bullet.toLowerCase();
    const hasVerb = verbs.some((verb) => new RegExp(`\\b${escapeRegExp(verb)}\\b`, "i").test(normalized));
    if (hasVerb) {
      matches.push(bullet);
    }
  }

  return dedupePreserveOrder(matches);
}

function detectQuantifiedBullets(bullets: string[]): string[] {
  const matches: string[] = [];
  for (const bullet of bullets) {
    if (/[\d$%]/.test(bullet) || /(?:increased|decreased|improved|reduced|boosted|grew|cut|saved)\b.*\d+/i.test(bullet)) {
      matches.push(bullet);
    }
  }
  return dedupePreserveOrder(matches);
}

function wordsPerBullet(bullets: string[]): number {
  if (bullets.length === 0) {
    return 0;
  }
  const totalWords = bullets.reduce((total, bullet) => total + countWords(bullet), 0);
  return Number((totalWords / bullets.length).toFixed(1));
}

function canonicalizeKeyword(value: string): string {
  const normalized = normalizeForMatch(value);
  for (const [canonical, variants] of Object.entries(atsConfig.synonyms)) {
    const canonicalNormalized = normalizeForMatch(canonical);
    if (normalized === canonicalNormalized) {
      return canonical;
    }
    for (const variant of variants) {
      if (normalized === normalizeForMatch(variant)) {
        return canonical;
      }
    }
  }
  return titleCaseKeyword(value);
}

function keywordVariants(keyword: string): string[] {
  const variants = new Set<string>();
  variants.add(keyword);

  const canonical = canonicalizeKeyword(keyword);
  variants.add(canonical);

  const canonicalEntry = Object.entries(atsConfig.synonyms).find(([candidate]) => normalizeForMatch(candidate) === normalizeForMatch(canonical));
  if (canonicalEntry) {
    const [canonicalName, aliasList] = canonicalEntry;
    variants.add(canonicalName);
    for (const alias of aliasList) {
      variants.add(alias);
    }
  }

  return Array.from(variants).filter(Boolean);
}

function phraseContainsKeyword(text: string, keyword: string): boolean {
  const normalizedText = normalizeForMatch(text);
  const normalizedKeyword = normalizeForMatch(keyword);
  if (!normalizedKeyword) {
    return false;
  }

  const exactPattern = new RegExp(`(^|\\W)${escapeRegExp(normalizedKeyword)}($|\\W)`, "i");
  if (exactPattern.test(normalizedText)) {
    return true;
  }

  return normalizedText.includes(normalizedKeyword);
}

function isSkillLikeKeyword(keyword: string): boolean {
  const normalized = normalizeForMatch(keyword);
  if (!normalized) {
    return false;
  }

  if (atsConfig.softSkills.some((signal) => normalized.includes(signal.toLowerCase()))) {
    return true;
  }

  if (atsConfig.certificationSignals.some((signal) => normalized.includes(signal.toLowerCase()))) {
    return true;
  }

  if (atsConfig.toolPlatformSignals.some((signal) => normalized.includes(signal.toLowerCase()))) {
    return true;
  }

  if (Object.keys(atsConfig.synonyms).some((canonical) => normalized.includes(normalizeForMatch(canonical)))) {
    return true;
  }

  return /[+/.-]|\b(api|cloud|framework|platform|tool|server|database|devops|analytics|testing|security)\b/i.test(keyword);
}

function classifyGapCategory(keyword: string): AtsGapCategory {
  const normalized = normalizeForMatch(keyword);

  if (atsConfig.certificationSignals.some((signal) => normalized.includes(signal.toLowerCase()))) {
    return "Certification";
  }

  if (atsConfig.softSkills.some((signal) => normalized.includes(signal.toLowerCase()))) {
    return "Soft Skill";
  }

  if (atsConfig.toolPlatformSignals.some((signal) => normalized.includes(signal.toLowerCase()))) {
    return "Tool/Platform";
  }

  if (/\b(year|years|experience|experienced)\b/i.test(normalized)) {
    return "Experience";
  }

  if (/\b(cert|certified|credential|license|license)\b/i.test(normalized)) {
    return "Certification";
  }

  if (/\b(api|framework|platform|cloud|database|analytics|testing|security|architecture|automation|integration)\b/i.test(normalized)) {
    return "Technical Skill";
  }

  return "Domain Knowledge";
}

function buildLearningResources(keyword: string, category: AtsGapCategory): AtsGapLearningResource[] {
  const baseQuery = keyword.trim();
  const docsQuery = `${baseQuery} official documentation`;
  const courseQuery = `learn ${baseQuery}`;
  const videoQuery = `${baseQuery} tutorial`;
  const practiceQuery = `${baseQuery} practice`;

  if (category === "Certification") {
    return [
      { title: `Official ${baseQuery} certification guide`, type: "docs", platform: "Official docs", searchQuery: `${baseQuery} certification guide` },
      { title: `${baseQuery} certification prep video`, type: "video", platform: "YouTube", searchQuery: `${baseQuery} certification prep` },
      { title: `${baseQuery} certification course`, type: "course", platform: "Coursera", searchQuery: `${baseQuery} certification course` },
      { title: `${baseQuery} practice questions`, type: "practice", platform: "Udemy", searchQuery: `${baseQuery} practice questions` },
    ];
  }

  if (category === "Soft Skill") {
    return [
      { title: `${baseQuery} playbook`, type: "book", platform: "Book search", searchQuery: `${baseQuery} book` },
      { title: `${baseQuery} workshop`, type: "course", platform: "Coursera", searchQuery: `${baseQuery} workshop` },
      { title: `${baseQuery} examples`, type: "video", platform: "YouTube", searchQuery: `${baseQuery} examples` },
      { title: `${baseQuery} interview practice`, type: "practice", platform: "Official docs", searchQuery: `${baseQuery} interview practice` },
    ];
  }

  if (category === "Tool/Platform") {
    return [
      { title: `Official ${baseQuery} docs`, type: "docs", platform: "Official docs", searchQuery: docsQuery },
      { title: `${baseQuery} tutorial`, type: "video", platform: "YouTube", searchQuery: videoQuery },
      { title: `Learn ${baseQuery}`, type: "course", platform: "Coursera", searchQuery: courseQuery },
      { title: `${baseQuery} hands-on practice`, type: "practice", platform: "Udemy", searchQuery: practiceQuery },
    ];
  }

  return [
    { title: `Official ${baseQuery} documentation`, type: "docs", platform: "Official docs", searchQuery: docsQuery },
    { title: `${baseQuery} learning path`, type: "course", platform: "Coursera", searchQuery: courseQuery },
    { title: `${baseQuery} walkthrough`, type: "video", platform: "YouTube", searchQuery: videoQuery },
    { title: `${baseQuery} practice exercises`, type: "practice", platform: "Udemy", searchQuery: practiceQuery },
  ];
}

function guessFirstTextBlock(lines: string[], excludedSectionIndex: number): string {
  const beforeFirstHeader = lines.slice(0, excludedSectionIndex).map((line) => line.trim()).filter(Boolean);
  return normalizeWhitespace(beforeFirstHeader.join(" "));
}

function extractKeywordCandidates(jobDescription: string): Array<{ keyword: string; source: "dictionary" | "phrase"; score: number }> {
  const normalizedJobDescription = jobDescription.trim();
  if (!normalizedJobDescription) {
    return [];
  }

  const candidateMap = new Map<string, { keyword: string; source: "dictionary" | "phrase"; score: number }>();

  for (const [canonical, aliases] of Object.entries(atsConfig.synonyms)) {
    const variants = [canonical, ...aliases];
    const matchedVariant = variants.find((variant) => phraseContainsKeyword(normalizedJobDescription, variant));
    if (matchedVariant) {
      const score = 8 + canonical.split(/\s+/).length;
      candidateMap.set(normalizeForMatch(canonical), {
        keyword: canonicalizeKeyword(canonical),
        source: "dictionary",
        score,
      });
    }
  }

  const lines = normalizedJobDescription.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    const fragments = line
      .split(/[•·|;/]/g)
      .flatMap((part) => part.split(/\b(?:and|or|with|using|plus|for|to|of|in|on)\b/gi))
      .map((fragment) => normalizeWhitespace(fragment))
      .filter(Boolean);

    for (const fragment of fragments) {
      if (/\b\d+(?:\.\d+)?\s*\+?\s*(?:years?|yrs?)\b/i.test(fragment)) {
        continue;
      }

      const phrase = normalizeWhitespace(
        fragment
          .replace(/\b(?:strong|solid|hands[- ]on|proven|demonstrated|extensive|deep|advanced|senior|junior|lead|principal)\b/gi, "")
          .replace(/\b(?:required|needed|preferred|preferably|must have|must|should|looking for|seeking)\b/gi, "")
          .replace(/\b(?:skills?|skill|experience|experienced|knowledge|ability|abilities)\b/gi, "")
          .replace(/\b(?:years?|yrs?)\b/gi, "")
          .replace(/[.,:;]+$/g, "")
      );
      const words = tokenizeWords(phrase).filter((word) => !isLikelyStopWord(word));
      const phraseWordCount = words.length;
      if (phraseWordCount === 0) {
        continue;
      }

      if (phraseWordCount > atsConfig.keywordExtraction.maxPhraseWords) {
        continue;
      }

      const singleWord = phraseWordCount === 1;
      const containsSignal =
        /[+#/.-]/.test(phrase) ||
        /\d/.test(phrase) ||
        /[A-Z]{2,}/.test(fragment) ||
        atsConfig.softSkills.some((signal) => phrase.toLowerCase().includes(signal.toLowerCase())) ||
        atsConfig.toolPlatformSignals.some((signal) => phrase.toLowerCase().includes(signal.toLowerCase())) ||
        atsConfig.certificationSignals.some((signal) => phrase.toLowerCase().includes(signal.toLowerCase()));
      const dictionaryMatch = Object.entries(atsConfig.synonyms).some(([canonical, aliases]) => {
        const normalizedPhrase = normalizeForMatch(phrase);
        return normalizeForMatch(canonical) === normalizedPhrase || aliases.some((alias) => normalizeForMatch(alias) === normalizedPhrase);
      });
      const hasMeaningfulLength = phrase.length >= atsConfig.keywordExtraction.minPhraseLength;
      const looksUseful =
        hasMeaningfulLength &&
        !isLikelyNoiseWord(phrase) &&
        (dictionaryMatch || containsSignal || singleWord || phraseWordCount <= 2);

      if (!looksUseful || (phraseWordCount > 2 && !containsSignal && !dictionaryMatch)) {
        continue;
      }

      const canonical = canonicalizeKeyword(phrase);
      const score =
        phraseWordCount >= 2 ? 3 : 1 + (containsSignal ? 2 : 0) + (phrase.length > 8 ? 1 : 0) + (fragment.includes(" ") ? 1 : 0);

      if (score < atsConfig.keywordExtraction.minimumPhraseScore) {
        continue;
      }

      const normalizedKey = normalizeForMatch(canonical);
      const existing = candidateMap.get(normalizedKey);
      if (!existing || existing.score < score) {
        candidateMap.set(normalizedKey, {
          keyword: canonical,
          source: "phrase",
          score,
        });
      }
    }
  }

  return Array.from(candidateMap.values())
    .sort((left, right) => right.score - left.score || left.keyword.localeCompare(right.keyword))
    .slice(0, atsConfig.keywordExtraction.maxKeywords);
}

function formatYears(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return value.toFixed(value % 1 === 0 ? 0 : 1);
}

function createSummaryText(result: AtsAnalysisResult): string {
  const keywordSummary = result.keywordDetails.requiredKeywords.length
    ? `${result.keywordDetails.matchedKeywords.length}/${result.keywordDetails.requiredKeywords.length} keywords matched`
    : "no job-specific keywords provided";
  const sectionSummary = `${result.sections.detectedSections.length}/6 ATS sections present`;
  const experienceSummary = result.experienceDetails.requiredYears !== null
    ? result.experienceDetails.requirementMet
      ? `experience meets the ${result.experienceDetails.requiredYears}+ year requirement`
      : `experience is ${formatYears(result.experienceDetails.yearsGap ?? 0)} years short of the ${result.experienceDetails.requiredYears}+ year requirement`
    : `${formatYears(result.experienceDetails.totalExperienceYears)} years of experience detected`;

  return `ATS score ${result.atsScore}. ${keywordSummary}, ${sectionSummary}, and ${experienceSummary}.`;
}

function toHtmlBullets(bullets: string[]): string {
  const uniqueBullets = dedupePreserveOrder(bullets.map((bullet) => normalizeWhitespace(bullet)).filter(Boolean));
  if (uniqueBullets.length === 0) {
    return "";
  }

  const items = uniqueBullets.map((bullet) => `<li>${bullet}</li>`).join("");
  return `<ul>${items}</ul>`;
}

function reorderBulletsByKeywordPriority(bullets: string[], keywords: string[], maxBullets: number): string[] {
  if (bullets.length === 0) {
    return [];
  }

  const keywordList = keywords.map((keyword) => normalizeForMatch(keyword));
  const scored = bullets.map((bullet, index) => {
    const normalized = normalizeForMatch(bullet);
    const hits = keywordList.reduce((count, keyword) => (keyword && normalized.includes(keyword) ? count + 1 : count), 0);
    return { bullet, index, hits };
  });

  return scored
    .sort((left, right) => right.hits - left.hits || left.index - right.index)
    .slice(0, Math.max(1, maxBullets))
    .map((item) => item.bullet);
}

function extractTopSkillSuggestions(keywords: string[], existingSkills: string[], maxSuggestions: number): string[] {
  const normalizedExisting = new Set(existingSkills.map((skill) => normalizeForMatch(skill)));
  const suggestions: string[] = [];

  for (const keyword of keywords) {
    if (!isSkillLikeKeyword(keyword)) {
      continue;
    }
    const display = canonicalizeKeyword(keyword);
    if (normalizedExisting.has(normalizeForMatch(display))) {
      continue;
    }
    suggestions.push(display);
    if (suggestions.length >= maxSuggestions) {
      break;
    }
  }

  return dedupePreserveOrder(suggestions);
}

function buildGapContext(keyword: string, analysis: AtsAnalysisResult): string {
  const requiredYears = analysis.experienceDetails.requiredYears;
  if (classifyGapCategory(keyword) === "Experience" && requiredYears !== null) {
    return `The job description asks for at least ${requiredYears}+ years of experience, and your current resume is below that threshold.`;
  }

  return `The job description mentions ${keyword}, but your resume does not surface it yet.`;
}

function buildGapImportance(index: number, analysis: AtsAnalysisResult, keyword: string): "high" | "medium" | "low" {
  if (analysis.keywordDetails.score < 60 && index < 5) {
    return "high";
  }
  if (classifyGapCategory(keyword) === "Certification" || classifyGapCategory(keyword) === "Experience") {
    return "high";
  }
  if (index < 8) {
    return "medium";
  }
  return "low";
}

function buildGapInsights(analysis: AtsAnalysisResult): AtsGapInsight[] {
  const gaps: AtsGapInsight[] = [];
  const added = new Set<string>();

  if (analysis.experienceDetails.requiredYears !== null && analysis.experienceDetails.requirementMet === false) {
    const gapKeyword = `${analysis.experienceDetails.requiredYears}+ years of experience`;
    gaps.push({
      id: "experience-years-gap",
      category: "Experience",
      item: gapKeyword,
      importance: "high",
      context: buildGapContext(gapKeyword, analysis),
      learningResources: buildLearningResources(gapKeyword, "Experience"),
    });
    added.add(normalizeForMatch(gapKeyword));
  }

  for (const section of analysis.sections.missingSections) {
    const label = titleCaseKeyword(section);
    const importance: "high" | "medium" | "low" = section === "skills" || section === "experience" ? "high" : section === "summary" ? "medium" : "low";
    const category: AtsGapCategory = section === "certifications" ? "Certification" : section === "projects" ? "Domain Knowledge" : section === "education" ? "Domain Knowledge" : section === "summary" ? "Domain Knowledge" : section === "skills" ? "Technical Skill" : "Experience";
    const key = normalizeForMatch(label);
    if (added.has(key)) {
      continue;
    }
    gaps.push({
      id: `missing-section-${section}`,
      category,
      item: label,
      importance,
      context: `Your resume is missing a ${label.toLowerCase()} section, which makes it harder for ATS systems to find the right signals.`,
      learningResources: buildLearningResources(label, category),
    });
    added.add(key);
  }

  const topMissingKeywords = analysis.keywordDetails.missingKeywords.slice(0, atsConfig.optimization.maxGapKeywords);
  topMissingKeywords.forEach((keyword, index) => {
    const normalized = normalizeForMatch(keyword);
    if (added.has(normalized)) {
      return;
    }

    const category = classifyGapCategory(keyword);
    gaps.push({
      id: `keyword-${slugify(keyword)}`,
      category,
      item: canonicalizeKeyword(keyword),
      importance: buildGapImportance(index, analysis, keyword),
      context: buildGapContext(keyword, analysis),
      learningResources: buildLearningResources(canonicalizeKeyword(keyword), category),
    });
    added.add(normalized);
  });

  return gaps.slice(0, atsConfig.optimization.maxGapKeywords + 4);
}

function slugify(value: string): string {
  return normalizeForMatch(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export class SectionDetector {
  constructor(private readonly config: AtsConfig = atsConfig) {}

  detectFromText(value: string): Record<AtsSectionKey, boolean> {
    const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const result = buildEmptySectionMap();
    for (const line of lines) {
      const section = isSectionHeaderLine(line);
      if (section) {
        result[section] = true;
      }
    }
    return result;
  }

  detectFromStructuredResume(resumeData: ResumeData): Record<AtsSectionKey, boolean> {
    return {
      summary: Boolean(resumeData.summary.trim()),
      skills: resumeData.skills.length > 0,
      experience: resumeData.workExperience.length > 0,
      education: resumeData.education.length > 0,
      projects: false,
      certifications: resumeData.certifications.length > 0,
    };
  }

  scoreSections(presence: Record<AtsSectionKey, boolean>): SectionAnalysisResult {
    const pointsEarned = SECTION_ORDER.reduce((total, section) => {
      return total + (presence[section] ? this.config.sectionPoints[section] : 0);
    }, 0);

    const maxPoints = SECTION_ORDER.reduce((total, section) => total + this.config.sectionPoints[section], 0);
    const detectedSections = SECTION_ORDER.filter((section) => presence[section]).map(titleCaseKeyword);
    const missingSections = SECTION_ORDER.filter((section) => !presence[section]).map((section) => section);

    return {
      score: Math.round((pointsEarned / Math.max(1, maxPoints)) * 100),
      pointsEarned,
      maxPoints,
      detectedSections,
      missingSections,
      presentMap: presence,
    };
  }
}

export class ResumeParser {
  constructor(private readonly config: AtsConfig = atsConfig) {}

  parse(input: AtsInput): ParsedResume {
    if (typeof input === "string") {
      return this.parseText(input);
    }
    return this.parseStructuredResume(input);
  }

  private parseStructuredResume(resumeData: Partial<ResumeData>): ParsedResume {
    const normalizedResumeData = normalizeResumeData(resumeData);
    const contact = parseContactInfo(
      [
        normalizedResumeData.personalInfo.fullName,
        normalizedResumeData.personalInfo.email,
        normalizedResumeData.personalInfo.phone,
        normalizedResumeData.personalInfo.location,
        normalizedResumeData.personalInfo.linkedin ?? "",
        normalizedResumeData.personalInfo.website ?? "",
        normalizedResumeData.personalInfo.jobTitle ?? "",
        normalizedResumeData.summary,
        normalizedResumeData.skills.join(" "),
      ].join("\n"),
      normalizedResumeData.personalInfo.fullName || null
    );

    const workExperience = normalizedResumeData.workExperience.map((experience) => {
      const plainDescription = htmlToPlainText(experience.description);
      const bullets = htmlToBulletLines(experience.description);
      const range = buildDateRange(experience.startDate, experience.endDate);

      return {
        id: experience.id,
        title: experience.title.trim(),
        company: experience.company.trim(),
        location: experience.location?.trim() ?? "",
        description: normalizeWhitespace(plainDescription),
        bullets,
        startDate: experience.startDate,
        endDate: experience.endDate,
        range,
      };
    });

    const summary = normalizeWhitespace(normalizedResumeData.summary);
    const skills = dedupePreserveOrder(
      normalizedResumeData.skills.map((skill) => normalizeWhitespace(skill)).filter(Boolean)
    );
    const education = normalizedResumeData.education
      .map((item) => normalizeWhitespace([item.degree, item.field, item.institution, item.honors ?? ""].filter(Boolean).join(" ")))
      .filter(Boolean);
    const certifications = normalizedResumeData.certifications
      .map((item) => normalizeWhitespace([item.name, item.issuer].filter(Boolean).join(" ")))
      .filter(Boolean);
    const bulletPoints = dedupePreserveOrder(workExperience.flatMap((item) => item.bullets));
    const experiencePeriods = mergeDateRanges(
      dedupePreserveOrder(
        workExperience
          .map((item) => item.range)
          .filter((range): range is ParsedDateRange => Boolean(range))
          .map((range) => `${range.rawStart} - ${range.rawEnd}`)
      ).map((rangeText) => {
        const [rawStart, rawEnd] = rangeText.split(" - ");
        return buildDateRange(rawStart, rawEnd) as ParsedDateRange;
      })
    );

    const fullTextParts = [
      normalizedResumeData.personalInfo.fullName,
      normalizedResumeData.personalInfo.email,
      normalizedResumeData.personalInfo.phone,
      normalizedResumeData.personalInfo.location,
      normalizedResumeData.personalInfo.linkedin ?? "",
      normalizedResumeData.personalInfo.website ?? "",
      normalizedResumeData.personalInfo.jobTitle ?? "",
      normalizedResumeData.targetRole,
      summary,
      skills.join(" "),
      workExperience.map((experience) => `${experience.title} ${experience.company} ${htmlToPlainText(experience.description)}`).join("\n"),
      education.join(" "),
      certifications.join(" "),
    ];

    const fullText = normalizeWhitespace(fullTextParts.filter(Boolean).join(" \n "));
    const normalizedText = normalizeForMatch(fullText);
    const sectionPresence = new SectionDetector(this.config).detectFromStructuredResume(normalizedResumeData);

    return {
      sourceType: "structured",
      fullText,
      normalizedText,
      wordCount: countWords(fullText),
      bulletPoints,
      contact,
      sections: sectionPresence,
      summary,
      skills,
      workExperience,
      education,
      certifications,
      projects: [],
      experiencePeriods,
    };
  }

  private parseText(value: string): ParsedResume {
    const normalizedInput = value.replace(/\r/g, "");
    const lines = normalizedInput.split(/\n/).map((line) => line.trim());
    const sectionDetector = new SectionDetector(this.config);
    const sectionPresence = sectionDetector.detectFromText(normalizedInput);
    const sectionBlocks = this.splitSections(lines);

    let summary = normalizeWhitespace(sectionBlocks.summary.join(" "));
    if (!summary) {
      const firstHeaderIndex = lines.findIndex((line) => isSectionHeaderLine(line));
      const leadingText = guessFirstTextBlock(lines, firstHeaderIndex < 0 ? lines.length : firstHeaderIndex);
      if (leadingText.split(/\s+/).length >= 20) {
        summary = leadingText;
      }
    }

    const skills = dedupePreserveOrder(
      sectionBlocks.skills
        .join(" ")
        .split(/[,;|\/\n]/g)
        .map((skill) => normalizeWhitespace(skill))
        .filter((skill) => skill.length > 1)
    );

    const experienceSectionText = sectionBlocks.experience.join(" \n ");
    const experienceBullets = textToBulletLines(experienceSectionText);
    const experiencePeriods = mergeDateRanges(parseDateRangesFromText(normalizedInput));
    const experienceEntries: ParsedExperienceEntry[] = [];

    if (experienceSectionText.trim()) {
      experienceEntries.push({
        id: "experience-text",
        title: "Experience",
        company: "",
        location: "",
        description: normalizeWhitespace(experienceSectionText),
        bullets: experienceBullets,
        startDate: "",
        endDate: "",
        range: experiencePeriods[0] ?? null,
      });
    }

    const contact = parseContactInfo(normalizedInput);
    const fullText = normalizeWhitespace(lines.filter(Boolean).join(" \n "));

    return {
      sourceType: "text",
      fullText,
      normalizedText: normalizeForMatch(fullText),
      wordCount: countWords(fullText),
      bulletPoints: dedupePreserveOrder([
        ...textToBulletLines(normalizedInput),
        ...experienceBullets,
      ]),
      contact,
      sections: sectionPresence,
      summary,
      skills,
      workExperience: experienceEntries,
      education: sectionBlocks.education,
      certifications: sectionBlocks.certifications,
      projects: sectionBlocks.projects,
      experiencePeriods,
    };
  }

  private splitSections(lines: string[]): Record<AtsSectionKey, string[]> {
    const blocks = buildEmptyStringMap();
    let activeSection: AtsSectionKey | null = null;

    for (const originalLine of lines) {
      const line = originalLine.trim();
      if (!line) {
        continue;
      }

      const section = isSectionHeaderLine(line);
      if (section) {
        activeSection = section;
        continue;
      }

      if (activeSection) {
        blocks[activeSection].push(line);
      }
    }

    return blocks;
  }
}

export class KeywordMatcher {
  private readonly canonicalLookup = new Map<string, string>();

  constructor(private readonly config: AtsConfig = atsConfig) {
    for (const [canonical, aliases] of Object.entries(this.config.synonyms)) {
      this.canonicalLookup.set(normalizeForMatch(canonical), canonical);
      for (const alias of aliases) {
        this.canonicalLookup.set(normalizeForMatch(alias), canonical);
      }
    }
  }

  extract(jobDescription: string): Array<{ keyword: string; source: "dictionary" | "phrase"; score: number }> {
    return extractKeywordCandidates(jobDescription).map((candidate) => ({
      ...candidate,
      keyword: this.canonicalize(candidate.keyword),
    }));
  }

  match(jobDescription: string, resume: ParsedResume): KeywordMatchResult {
    const extracted = this.extract(jobDescription);
    if (extracted.length === 0) {
      return {
        requiredKeywords: [],
        matchedKeywords: [],
        missingKeywords: [],
        score: 100,
        matchRatio: 1,
        keywordSignals: [],
      };
    }

    const corpus = [
      resume.fullText,
      resume.summary,
      resume.skills.join(" "),
      resume.bulletPoints.join(" "),
      resume.education.join(" "),
      resume.certifications.join(" "),
      resume.projects.join(" "),
    ]
      .filter(Boolean)
      .join(" \n ");

    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    for (const candidate of extracted) {
      const canonical = this.canonicalize(candidate.keyword);
      const variants = keywordVariants(canonical);
      const matched = variants.some((variant) => phraseContainsKeyword(corpus, variant));
      if (matched) {
        matchedKeywords.push(canonical);
      } else {
        missingKeywords.push(canonical);
      }
    }

    const uniqueRequired = dedupePreserveOrder(extracted.map((candidate) => this.canonicalize(candidate.keyword)));
    const uniqueMatched = dedupePreserveOrder(matchedKeywords);
    const uniqueMissing = dedupePreserveOrder(missingKeywords);
    const score = Math.round((uniqueMatched.length / Math.max(1, uniqueRequired.length)) * 100);

    return {
      requiredKeywords: uniqueRequired,
      matchedKeywords: uniqueMatched,
      missingKeywords: uniqueMissing,
      score,
      matchRatio: uniqueMatched.length / Math.max(1, uniqueRequired.length),
      keywordSignals: extracted.map((candidate) => ({
        keyword: this.canonicalize(candidate.keyword),
        source: candidate.source,
        score: candidate.score,
      })),
    };
  }

  private canonicalize(keyword: string): string {
    const normalized = normalizeForMatch(keyword);
    return this.canonicalLookup.get(normalized) ?? canonicalizeKeyword(keyword);
  }
}

export class ExperienceCalculator {
  constructor(private readonly config: AtsConfig = atsConfig) {}

  calculate(resume: ParsedResume, jobDescription: string): ExperienceAnalysisResult {
    const periods = resume.experiencePeriods.length > 0 ? resume.experiencePeriods : resume.workExperience.map((experience) => experience.range).filter((range): range is ParsedDateRange => Boolean(range));
    const months = sumDateRanges(periods);
    const years = Number((months / 12).toFixed(1));
    const requiredYears = parseRequiredYears(jobDescription);
    const positionCount = resume.workExperience.length || periods.length;

    let score = 0;
    let requirementMet: boolean | null = null;
    let yearsGap: number | null = null;
    let explanation = "No work experience was detected.";

    if (requiredYears !== null) {
      requirementMet = years >= requiredYears;
      yearsGap = requirementMet ? 0 : Number((requiredYears - years).toFixed(1));
      score = requiredYears === 0 ? 100 : Math.round(Math.min(100, (years / requiredYears) * 100));
      explanation = requirementMet
        ? `Detected ${formatYears(years)} years of experience, which meets the ${requiredYears}+ year requirement.`
        : `Detected ${formatYears(years)} years of experience, which is below the ${requiredYears}+ year requirement by ${formatYears(yearsGap)} years.`;
    } else {
      if (years === 0) {
        score = 0;
        explanation = "No job-specific years requirement was found and the resume does not show dated experience.";
      } else if (years < 1) {
        score = this.config.experience.underOneYearScore;
        explanation = `Detected ${formatYears(years)} years of experience.`;
      } else if (years < 3) {
        score = this.config.experience.oneToThreeYearsScore;
        explanation = `Detected ${formatYears(years)} years of experience across ${positionCount} role${positionCount === 1 ? "" : "s"}.`;
      } else if (years < 5) {
        score = this.config.experience.threeToFiveYearsScore;
        explanation = `Detected ${formatYears(years)} years of experience across ${positionCount} role${positionCount === 1 ? "" : "s"}.`;
      } else {
        score = this.config.experience.fivePlusYearsScore;
        explanation = `Detected ${formatYears(years)} years of experience across ${positionCount} role${positionCount === 1 ? "" : "s"}.`;
      }

      if (positionCount >= 2 && years >= 2) {
        score = Math.min(100, score + this.config.experience.extraPositionBonus);
      }
    }

    return {
      totalExperienceMonths: months,
      totalExperienceYears: years,
      positionCount,
      requiredYears,
      requirementMet,
      yearsGap,
      score: Math.max(0, Math.min(100, score)),
      explanation,
      periods,
    };
  }
}

export class QualityAnalyzer {
  constructor(private readonly config: AtsConfig = atsConfig) {}

  analyze(resume: ParsedResume): QualityAnalysisResult {
    const bullets = resume.bulletPoints;
    const bulletCount = bullets.length;
    const averageWords = wordsPerBullet(bullets);
    const wordCountScore = scoreWordCount(resume.wordCount);
    const bulletScore = scoreBulletCount(bulletCount, averageWords);
    const actionVerbBullets = detectActionVerbBullets(bullets);
    const quantifiedBullets = detectQuantifiedBullets(bullets);
    const actionVerbCount = actionVerbBullets.length;
    const quantifiedAchievementCount = quantifiedBullets.length;
    const actionVerbScore = scoreActionVerbs(actionVerbCount, bulletCount);
    const quantifiedScore = scoreQuantifiedAchievements(quantifiedAchievementCount, bulletCount);
    const score = Math.round((wordCountScore + bulletScore + actionVerbScore + quantifiedScore) / 4);

    const explanations: string[] = [];
    if (resume.wordCount < this.config.quality.shortWordCountThreshold) {
      explanations.push(`Resume length is short at ${resume.wordCount} words.`);
    } else if (resume.wordCount > this.config.quality.longWordCountThreshold) {
      explanations.push(`Resume length is long at ${resume.wordCount} words.`);
    } else {
      explanations.push(`Resume length is within the ideal range at ${resume.wordCount} words.`);
    }
    explanations.push(`${bulletCount} bullet${bulletCount === 1 ? "" : "s"} detected with an average of ${averageWords} words per bullet.`);
    explanations.push(`${actionVerbCount} bullet${actionVerbCount === 1 ? "" : "s"} start with action verbs.`);
    explanations.push(`${quantifiedAchievementCount} bullet${quantifiedAchievementCount === 1 ? "" : "s"} include measurable outcomes.`);

    return {
      score,
      wordCount: resume.wordCount,
      bulletCount,
      actionVerbCount,
      quantifiedAchievementCount,
      averageWordsPerBullet: averageWords,
      wordCountScore,
      bulletScore,
      actionVerbScore,
      quantifiedScore,
      explanation: explanations.join(" "),
    };
  }
}

export class IssueDetector {
  constructor(private readonly config: AtsConfig = atsConfig) {}

  detect(analysis: Pick<AtsAnalysisResult, "keywordDetails" | "sections" | "experienceDetails" | "qualityDetails" | "contactDetails">): string[] {
    const issues: string[] = [];

    if (!analysis.contactDetails.email) {
      issues.push("Add an email address so recruiters can contact you directly.");
    }
    if (!analysis.contactDetails.phone) {
      issues.push("Add a phone number so ATS and recruiters can identify a contact path.");
    }
    if (!analysis.contactDetails.linkedin) {
      issues.push("Add a LinkedIn profile to strengthen your contact section.");
    }

    for (const section of analysis.sections.missingSections) {
      const pretty = titleCaseKeyword(section);
      issues.push(`Add a ${pretty} section to improve ATS readability.`);
    }

    if (analysis.keywordDetails.score < 70 && analysis.keywordDetails.missingKeywords.length > 0) {
      const topMissing = analysis.keywordDetails.missingKeywords.slice(0, 5);
      issues.push(`Your resume is missing ${topMissing.join(", ")} from the job description.`);
    }

    if (analysis.experienceDetails.requiredYears !== null && analysis.experienceDetails.requirementMet === false) {
      issues.push(
        `The job asks for ${analysis.experienceDetails.requiredYears}+ years of experience, but the resume currently shows ${formatYears(analysis.experienceDetails.totalExperienceYears)} years.`
      );
    }

    if (analysis.qualityDetails.wordCount < this.config.quality.shortWordCountThreshold) {
      issues.push("The resume is short enough that it may not include enough detail for ATS screening.");
    }

    if (analysis.qualityDetails.bulletCount < this.config.quality.minBulletPoints) {
      issues.push("Add more bullet points to make accomplishments easier for ATS tools to parse.");
    }

    if (analysis.qualityDetails.actionVerbCount < this.config.quality.minActionVerbs && analysis.qualityDetails.bulletCount > 0) {
      issues.push("Add more action verbs at the start of your bullet points.");
    }

    if (analysis.qualityDetails.quantifiedAchievementCount < this.config.quality.minQuantifiedAchievements && analysis.qualityDetails.bulletCount > 0) {
      issues.push("Add measurable results such as percentages, counts, or dollar impact.");
    }

    return dedupePreserveOrder(issues);
  }

  recommend(analysis: Pick<AtsAnalysisResult, "keywordDetails" | "sections" | "experienceDetails" | "qualityDetails" | "contactDetails">): string[] {
    const recommendations: string[] = [];

    if (!analysis.contactDetails.email) {
      recommendations.push("Include a current email address at the top of the resume.");
    }
    if (!analysis.contactDetails.phone) {
      recommendations.push("Add a phone number in the header.");
    }
    if (!analysis.contactDetails.linkedin) {
      recommendations.push("Link a complete LinkedIn profile.");
    }

    if (analysis.sections.missingSections.includes("skills")) {
      recommendations.push("Add a dedicated skills section that lists the tools and keywords from the job description.");
    }
    if (analysis.sections.missingSections.includes("summary")) {
      recommendations.push("Add a concise summary that mirrors the target role.");
    }
    if (analysis.sections.missingSections.includes("experience")) {
      recommendations.push("Add an experience section with role, company, dates, and bullet achievements.");
    }
    if (analysis.sections.missingSections.includes("education")) {
      recommendations.push("Add your education history to complete the resume structure.");
    }
    if (analysis.sections.missingSections.includes("certifications")) {
      recommendations.push("Add certifications if they support the target role.");
    }

    const topMissingKeywords = analysis.keywordDetails.missingKeywords.slice(0, this.config.optimization.maxSuggestedSkills);
    if (topMissingKeywords.length > 0) {
      recommendations.push(`Work these job keywords into the resume where they are accurate: ${topMissingKeywords.join(", ")}.`);
    }

    if (analysis.experienceDetails.requiredYears !== null && analysis.experienceDetails.requirementMet === false) {
      recommendations.push(`Emphasize any roles or projects that demonstrate ${analysis.experienceDetails.requiredYears}+ years of relevant experience.`);
    }

    if (analysis.qualityDetails.wordCount < this.config.quality.idealWordCountMin) {
      recommendations.push("Expand each role with more context, scope, and outcomes.");
    } else if (analysis.qualityDetails.wordCount > this.config.quality.longWordCountThreshold) {
      recommendations.push("Trim repetitive language and keep only the most relevant achievements.");
    }

    if (analysis.qualityDetails.actionVerbCount < this.config.quality.minActionVerbs) {
      recommendations.push("Start more bullets with action verbs such as led, built, developed, or optimized.");
    }
    if (analysis.qualityDetails.quantifiedAchievementCount < this.config.quality.minQuantifiedAchievements) {
      recommendations.push("Add measurable impact to several bullets so the resume reads as results driven.");
    }

    return dedupePreserveOrder(recommendations);
  }
}

export class ATSScoringService {
  private readonly parser: ResumeParser;
  private readonly keywordMatcher: KeywordMatcher;
  private readonly experienceCalculator: ExperienceCalculator;
  private readonly sectionDetector: SectionDetector;
  private readonly qualityAnalyzer: QualityAnalyzer;
  private readonly issueDetector: IssueDetector;

  constructor(private readonly config: AtsConfig = atsConfig) {
    this.parser = new ResumeParser(config);
    this.keywordMatcher = new KeywordMatcher(config);
    this.experienceCalculator = new ExperienceCalculator(config);
    this.sectionDetector = new SectionDetector(config);
    this.qualityAnalyzer = new QualityAnalyzer(config);
    this.issueDetector = new IssueDetector(config);
  }

  analyze(input: { resumeData?: Partial<ResumeData>; resumeText?: string; jobDescription?: string }): AtsAnalysisResult {
    const resumeInput = input.resumeData ?? input.resumeText ?? "";
    const parsedResume = this.parser.parse(resumeInput);
    const jobDescription = normalizeWhitespace(input.jobDescription ?? "");

    const keywordDetails = this.keywordMatcher.match(jobDescription, parsedResume);
    const sectionDetails = this.sectionDetector.scoreSections(parsedResume.sections);
    const experienceDetails = this.experienceCalculator.calculate(parsedResume, jobDescription);
    const qualityDetails = this.qualityAnalyzer.analyze(parsedResume);
    const contactDetails: ContactAnalysisResult = {
      email: Boolean(parsedResume.contact.email),
      phone: Boolean(parsedResume.contact.phone),
      linkedin: Boolean(parsedResume.contact.linkedin),
      points:
        (parsedResume.contact.email ? this.config.contactPoints.email : 0) +
        (parsedResume.contact.phone ? this.config.contactPoints.phone : 0) +
        (parsedResume.contact.linkedin ? this.config.contactPoints.linkedin : 0),
      missing: [
        !parsedResume.contact.email ? "email" : null,
        !parsedResume.contact.phone ? "phone" : null,
        !parsedResume.contact.linkedin ? "linkedin" : null,
      ].filter((value): value is string => Boolean(value)),
    };

    const keywordScore = keywordDetails.score;
    const sectionScore = sectionDetails.score;
    const experienceScore = experienceDetails.score;
    const qualityScore = qualityDetails.score;

    const overallBeforeRounding =
      keywordScore * (this.config.weights.keyword / 100) +
      sectionScore * (this.config.weights.section / 100) +
      experienceScore * (this.config.weights.experience / 100) +
      qualityScore * (this.config.weights.quality / 100);

    const atsScore = Math.max(0, Math.min(100, Math.round(overallBeforeRounding)));
    const scoreBreakdown: AtsScoreBreakdown = {
      keyword: keywordDetails,
      section: sectionDetails,
      experience: experienceDetails,
      quality: qualityDetails,
      contact: contactDetails,
      weights: this.config.weights,
      overallBeforeRounding,
    };

    const analysis: AtsAnalysisResult = {
      atsScore,
      keywordScore,
      sectionScore,
      experienceScore,
      qualityScore,
      matchedKeywords: keywordDetails.matchedKeywords,
      missingKeywords: keywordDetails.missingKeywords,
      issues: [],
      recommendations: [],
      analysisSummary: "",
      scoreBreakdown,
      sections: sectionDetails,
      keywordDetails,
      experienceDetails,
      qualityDetails,
      contactDetails,
    };

    analysis.issues = this.issueDetector.detect(analysis);
    analysis.recommendations = this.issueDetector.recommend(analysis);
    analysis.analysisSummary = createSummaryText(analysis);

    return analysis;
  }

  optimize(input: { resumeData?: Partial<ResumeData>; resumeText?: string; jobDescription?: string }): AtsOptimizationResult {
    const baseResume = input.resumeData ? normalizeResumeData(input.resumeData) : null;
    const analysis = this.analyze(input);
    const parsedResume = this.parser.parse(input.resumeData ?? input.resumeText ?? "");
    const topMissingKeywords = analysis.missingKeywords.slice(0, this.config.optimization.maxSuggestedSkills);
    const additionalSkills = extractTopSkillSuggestions(topMissingKeywords, parsedResume.skills, this.config.optimization.maxSuggestedSkills);

    const summary = this.buildOptimizedSummary(parsedResume, analysis, input.resumeData?.targetRole);
    const workExperience = parsedResume.workExperience.map((entry) => ({
      id: entry.id,
      description: this.buildOptimizedExperienceDescription(entry, analysis),
    }));

    const optimizedResumeData = baseResume
      ? this.applyOptimizations(baseResume, summary, workExperience, additionalSkills)
      : null;

    const projectedAnalysis = this.analyze(
      optimizedResumeData
        ? { resumeData: optimizedResumeData, jobDescription: input.jobDescription }
        : input
    );

    return {
      summary,
      workExperience,
      additionalSkills,
      atsScore: projectedAnalysis.atsScore,
      analysis: projectedAnalysis,
    };
  }

  private buildOptimizedSummary(parsedResume: ParsedResume, analysis: AtsAnalysisResult, targetRole?: string): string {
    const headline = normalizeWhitespace(
      targetRole?.trim() || parsedResume.summary.split(" ").slice(0, 3).join(" ") || analysis.matchedKeywords[0] || "Professional"
    );
    const years = formatYears(analysis.experienceDetails.totalExperienceYears);
    const matchedKeywords = analysis.matchedKeywords.slice(0, 3);
    const focus = matchedKeywords.length > 0 ? `with experience in ${joinList(matchedKeywords)}` : "with a results-driven delivery style";
    const baseSummary = parsedResume.summary.trim();

    let summary = `${headline} with ${years}+ years of experience ${focus}.`;
    if (baseSummary) {
      summary = `${summary} ${baseSummary}`;
    }

    return normalizeWhitespace(summary).slice(0, 340);
  }

  private buildOptimizedExperienceDescription(entry: ParsedExperienceEntry, analysis: AtsAnalysisResult): string {
    const originalBullets = entry.bullets.length > 0 ? entry.bullets : textToBulletLines(entry.description);
    const prioritizedBullets = reorderBulletsByKeywordPriority(
      originalBullets,
      analysis.matchedKeywords,
      this.config.optimization.maxOptimizedBulletsPerRole
    );

    const selected = prioritizedBullets.length > 0 ? prioritizedBullets : originalBullets.slice(0, this.config.optimization.maxOptimizedBulletsPerRole);
    return toHtmlBullets(selected);
  }

  private applyOptimizations(
    resumeData: ResumeData,
    summary: string,
    workExperience: Array<{ id: string; description: string }>,
    additionalSkills: string[]
  ): ResumeData {
    return {
      ...resumeData,
      summary,
      skills: additionalSkills.length > 0 ? dedupePreserveOrder([...resumeData.skills, ...additionalSkills]) : resumeData.skills,
      workExperience: resumeData.workExperience.map((experience) => {
        const optimized = workExperience.find((item) => item.id === experience.id);
        if (!optimized) {
          return experience;
        }
        return {
          ...experience,
          description: optimized.description,
        };
      }),
    };
  }
}

export function buildGapInsightsFromAnalysis(analysis: AtsAnalysisResult): AtsGapInsight[] {
  return buildGapInsights(analysis);
}

export function buildGapAnalysisSummary(analysis: AtsAnalysisResult): string {
  return createSummaryText(analysis);
}

export function buildLegacyGapAnalysisResponse(analysis: AtsAnalysisResult): {
  matchScore: number;
  matchSummary: string;
  gaps: AtsGapInsight[];
} {
  return {
    matchScore: analysis.atsScore,
    matchSummary: analysis.analysisSummary,
    gaps: buildGapInsights(analysis),
  };
}

export const defaultAtsScoringService = new ATSScoringService(atsConfig);

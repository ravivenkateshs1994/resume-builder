import { atsConfig } from "@/config/ats.config";

export type SkillCategory =
  | "language"
  | "framework"
  | "tool"
  | "platform"
  | "technology"
  | "methodology"
  | "certification"
  | "soft-skill"
  | "database"
  | "other";

export interface SkillTaxonomyEntry {
  canonicalName: string;
  aliases: string[];
  category: SkillCategory;
}

export interface NormalizedSkill extends SkillTaxonomyEntry {
  matchedValue: string;
  source: "taxonomy" | "heuristic" | "ai";
}

interface NormalizedSkillBatchResult {
  skills: NormalizedSkill[];
  unknownSkills: string[];
}

const runtimeTaxonomy = new Map<string, SkillTaxonomyEntry>();
const aliasIndex = new Map<string, string>();

const SPECIAL_CANONICALS: Record<string, string> = {
  "aem": "Adobe Experience Manager",
  "aws": "AWS",
  "azure": "Azure",
  "ci/cd": "CI/CD",
  "c sharp": "C#",
  "c#": "C#",
  "c plus plus": "C++",
  "c++": "C++",
  "graphql": "GraphQL",
  "gcp": "GCP",
  "html": "HTML",
  "javascript": "JavaScript",
  "js": "JavaScript",
  "k8s": "Kubernetes",
  "ml": "ML",
  "mongo": "MongoDB",
  "mysql": "MySQL",
  "next.js": "Next.js",
  "nextjs": "Next.js",
  "node": "Node.js",
  "node js": "Node.js",
  "node.js": "Node.js",
  "postgres": "PostgreSQL",
  "power bi": "Power BI",
  "qa": "QA",
  "react js": "React",
  "reactjs": "React",
  "rest api": "REST API",
  "rest apis": "REST API",
  "restful api": "REST API",
  "sql": "SQL",
  "typescript": "TypeScript",
  "ts": "TypeScript",
  "ui": "UI",
  "ux": "UX",
};

const SOFT_SKILLS = new Set(atsConfig.softSkills.map((skill) => normalizeLookup(skill)));
const CERTIFICATION_HINTS = new Set(atsConfig.certificationSignals.map((signal) => normalizeLookup(signal)));
const TOOL_HINTS = new Set(atsConfig.toolPlatformSignals.map((signal) => normalizeLookup(signal)));

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeLookup(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9+#/.\-\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function titleCaseWord(word: string): string {
  const lower = word.toLowerCase();

  if (SPECIAL_CANONICALS[lower]) {
    return SPECIAL_CANONICALS[lower];
  }

  if (/^[a-z]{1,3}$/.test(lower)) {
    return lower.toUpperCase();
  }

  if (/^[a-z]{2,4}\d+$/.test(lower)) {
    return lower.toUpperCase();
  }

  if (/^[a-z0-9]+(?:[./+\-][a-z0-9]+)+$/.test(lower)) {
    return lower.toUpperCase();
  }

  if (word === word.toUpperCase()) {
    return word;
  }

  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function canonicalizeSkillName(value: string): string {
  const normalized = normalizeLookup(value);
  if (!normalized) {
    return "";
  }

  if (SPECIAL_CANONICALS[normalized]) {
    return SPECIAL_CANONICALS[normalized];
  }

  return normalized
    .split(" ")
    .filter(Boolean)
    .map((word) => titleCaseWord(word))
    .join(" ");
}

function inferCategory(canonicalName: string, aliases: string[]): SkillCategory {
  const probe = normalizeLookup([canonicalName, ...aliases].join(" "));

  if (SOFT_SKILLS.has(normalizeLookup(canonicalName))) {
    return "soft-skill";
  }

  if (CERTIFICATION_HINTS.has(normalizeLookup(canonicalName)) || /certificat|certified|license|credential|badge/.test(probe)) {
    return "certification";
  }

  if (/\b(agile|scrum|kanban|lean|waterfall|itil|six sigma|devops)\b/.test(probe)) {
    return "methodology";
  }

  if (/\b(java|javascript|typescript|python|ruby|php|swift|kotlin|scala|go|rust|sql|html|css|c#|c\+\+|r|shell|bash)\b/.test(probe)) {
    return "language";
  }

  if (/\b(react|angular|vue|svelte|next\.js|nestjs|express|spring boot|fastapi|django|flask|laravel|jest|vitest|tailwind|bootstrap)\b/.test(probe)) {
    return "framework";
  }

  if (
    TOOL_HINTS.has(normalizeLookup(canonicalName)) ||
    /\b(aws|azure|gcp|google cloud|cloud|kubernetes|docker|terraform|cloudformation|salesforce|snowflake|tableau|power bi|jira|figma|postman|git|github|gitlab|adobe experience manager|aem|microsoft dynamics|service now|puppeteer|mammoth|pdf\.js)\b/.test(probe)
  ) {
    return "tool";
  }

  if (/\b(postgres|postgresql|mysql|mongodb|redis|oracle|sqlite|sql server|database|nosql)\b/.test(probe)) {
    return "database";
  }

  if (/\b(cms|crm|platform|analytics|data|infrastructure|security|testing|automation|architecture|api)\b/.test(probe)) {
    return "platform";
  }

  return "technology";
}

function addTaxonomyEntry(entry: SkillTaxonomyEntry): SkillTaxonomyEntry {
  const canonicalName = canonicalizeSkillName(entry.canonicalName);
  if (!canonicalName) {
    return entry;
  }

  const aliases = Array.from(
    new Set(
      [canonicalName, ...(entry.aliases ?? [])]
        .map((alias) => normalizeWhitespace(alias))
        .filter(Boolean)
    )
  );

  const existing = runtimeTaxonomy.get(normalizeLookup(canonicalName));
  const merged: SkillTaxonomyEntry = existing
    ? {
        canonicalName: existing.canonicalName,
        aliases: Array.from(new Set([...existing.aliases, ...aliases])),
        category: existing.category === "other" ? entry.category : existing.category,
      }
    : {
        canonicalName,
        aliases,
        category: entry.category,
      };

  runtimeTaxonomy.set(normalizeLookup(canonicalName), merged);
  for (const alias of [merged.canonicalName, ...merged.aliases]) {
    const key = normalizeLookup(alias);
    if (key) {
      aliasIndex.set(key, normalizeLookup(merged.canonicalName));
    }
  }

  return merged;
}

function seedTaxonomy(): void {
  if (runtimeTaxonomy.size > 0) {
    return;
  }

  for (const [canonicalName, aliases] of Object.entries(atsConfig.synonyms)) {
    addTaxonomyEntry({
      canonicalName,
      aliases: [...aliases],
      category: inferCategory(canonicalName, aliases),
    });
  }
}

seedTaxonomy();

export function registerSkillTaxonomyEntries(entries: SkillTaxonomyEntry[]): SkillTaxonomyEntry[] {
  return entries.map((entry) => addTaxonomyEntry(entry));
}

export function getSkillTaxonomyEntries(): SkillTaxonomyEntry[] {
  return Array.from(runtimeTaxonomy.values()).sort((left, right) => left.canonicalName.localeCompare(right.canonicalName));
}

export function resolveSkillTaxonomyEntry(value: string): SkillTaxonomyEntry | null {
  const normalized = normalizeLookup(value);
  if (!normalized) {
    return null;
  }

  const canonicalKey = aliasIndex.get(normalized) ?? normalized;
  return runtimeTaxonomy.get(canonicalKey) ?? null;
}

export function categorizeSkill(value: string): SkillCategory {
  const resolved = resolveSkillTaxonomyEntry(value);
  if (resolved) {
    return resolved.category;
  }

  const canonicalName = canonicalizeSkillName(value);
  if (!canonicalName) {
    return "other";
  }

  return inferCategory(canonicalName, []);
}

export function findSkillsInText(text: string): NormalizedSkill[] {
  const normalizedText = normalizeLookup(text);
  if (!normalizedText) {
    return [];
  }

  const sortedEntries = getSkillTaxonomyEntries().sort((left, right) => {
    const leftLength = Math.max(left.canonicalName.length, ...left.aliases.map((alias) => alias.length));
    const rightLength = Math.max(right.canonicalName.length, ...right.aliases.map((alias) => alias.length));
    return rightLength - leftLength;
  });

  const matches: NormalizedSkill[] = [];
  const seen = new Set<string>();

  for (const entry of sortedEntries) {
    const variants = [entry.canonicalName, ...entry.aliases].map((alias) => normalizeLookup(alias)).filter((alias) => alias.length > 1);

    const hit = variants.find((alias) => {
      const pattern = new RegExp(`(^|[^a-z0-9+#/.])${escapeRegExp(alias)}([^a-z0-9+#/.]|$)`, "i");
      return pattern.test(normalizedText);
    });

    if (!hit) {
      continue;
    }

    const key = normalizeLookup(entry.canonicalName);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    matches.push({
      canonicalName: entry.canonicalName,
      aliases: [...entry.aliases],
      category: entry.category,
      matchedValue: hit,
      source: "taxonomy",
    });
  }

  return matches;
}

export function normalizeSkillBatch(values: string[], suggestedEntries: SkillTaxonomyEntry[] = []): NormalizedSkillBatchResult {
  if (suggestedEntries.length > 0) {
    registerSkillTaxonomyEntries(suggestedEntries);
  }

  const normalizedSkills: NormalizedSkill[] = [];
  const unknownSkills: string[] = [];
  const seen = new Set<string>();

  for (const rawValue of values) {
    const trimmed = normalizeWhitespace(rawValue);
    if (!trimmed) {
      continue;
    }

    const normalizedLookupValue = normalizeLookup(trimmed);
    if (!normalizedLookupValue || normalizedLookupValue.length < 2) {
      continue;
    }

    if (SOFT_SKILLS.has(normalizedLookupValue) || atsConfig.stopWords.includes(normalizedLookupValue)) {
      continue;
    }

    const resolved = resolveSkillTaxonomyEntry(trimmed);
    if (resolved) {
      const key = normalizeLookup(resolved.canonicalName);
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      normalizedSkills.push({
        canonicalName: resolved.canonicalName,
        aliases: [...resolved.aliases],
        category: resolved.category,
        matchedValue: trimmed,
        source: "taxonomy",
      });
      continue;
    }

    const canonicalName = canonicalizeSkillName(trimmed);
    if (!canonicalName) {
      continue;
    }

    const key = normalizeLookup(canonicalName);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    const category = categorizeSkill(canonicalName);
    normalizedSkills.push({
      canonicalName,
      aliases: [],
      category,
      matchedValue: trimmed,
      source: "heuristic",
    });
    unknownSkills.push(canonicalName);
  }

  return {
    skills: normalizedSkills,
    unknownSkills: Array.from(new Set(unknownSkills)),
  };
}

export function normalizeSkillNames(values: string[], suggestedEntries: SkillTaxonomyEntry[] = []): string[] {
  return normalizeSkillBatch(values, suggestedEntries).skills.map((skill) => skill.canonicalName);
}

export function dedupeSkills(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => normalizeWhitespace(value)).filter(Boolean)));
}

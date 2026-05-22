// Pure regex/heuristic resume parser — no AI needed.
// Works with text extracted from PDFs (PDF.js) or DOCX (mammoth).

export interface ParsedResume {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    website: string;
    jobTitle: string;
  };
  summary: string;
  workExperience: WorkExp[];
  education: Edu[];
  skills: string[];
  certifications: Cert[];
  targetRole: string;
}

interface WorkExp {
  id: string;
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string; // HTML rich text
}

interface Edu {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
  honors: string;
}

interface Cert {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// ── Regex constants ───────────────────────────────────────────────────────────

const EMAIL_RE = /[\w.+'-]+@[\w-]+\.[a-zA-Z]{2,}/;
const PHONE_RE =
  /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]\d{4}|\+\d[\d\s().-]{6,14}/;
const LINKEDIN_RE = /linkedin\.com\/in\/[\w%-]+/i;
const WEBSITE_RE = /https?:\/\/(?!.*linkedin\.com)[\w./#%-]+/i;
const GPA_RE = /GPA[\s:]*([0-9]+(?:\.[0-9]+)?)/i;
const BULLET_RE = /^[•·▪▸►▶\-–*]\s+|^\d+\.\s+/;

const MO =
  "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";

// Matches "Jan 2020 – Mar 2023" or "2018 – Present" or "2018 - 2022"
const DATE_RANGE_RE = new RegExp(
  `(?:(${MO})\\.?\\s*)?(\\d{4})\\s*[-–—to]+\\s*(?:(${MO})\\.?\\s*)?(\\d{4}|present|current|now)`,
  "i"
);

const YEAR_RE = /\b(19|20)\d{2}\b/;

const DEGREE_RE =
  /\b(bachelor(?:'s)?|master(?:'s)?|ph\.?d\.?|doctor(?:ate)?|associate(?:'s)?|b\.?s\.?c?\.?|m\.?s\.?c?\.?|m\.?b\.?a\.?|b\.?a\.?|b\.?e\.?|m\.?e\.?|b\.?eng\.?|m\.?eng\.?|diploma|a\.?a\.?s?\.?)\b/i;

const HONORS_RE = /\b(cum laude|magna|summa|honors?|distinction|dean|merit|award)\b/i;

// Section header patterns — must be on their own line (or close to it)
const SECTIONS: [string, RegExp][] = [
  ["summary",  /^(summary|objective|profile|about me|professional summary|career summary|personal statement|overview)\s*:?\s*$/i],
  ["experience", /^(work\s+experience|experience|employment|work\s+history|professional\s+experience|career\s+history|positions?\s+held|relevant\s+experience|internships?)\s*:?\s*$/i],
  ["education", /^(education|academic(?:\s+background)?|educational\s+background|qualifications?|academics?)\s*:?\s*$/i],
  ["skills",   /^(skills?|technical\s+skills?|core\s+competencies|competencies|expertise|technologies|tools(?:\s+&\s+technologies)?|programming\s+languages?|languages?\s+&\s+tools)\s*:?\s*$/i],
  ["certifications", /^(certifications?|certificates?|licenses?|credentials?|professional\s+development|training|accreditations?)\s*:?\s*$/i],
];

/** Check if a line is a section header — matches keyword list OR is all-caps ≤4 words */
function isSectionHeader(line: string): string | null {
  const found = SECTIONS.find(([, re]) => re.test(line));
  if (found) return found[0];

  // Fallback: ALL CAPS short line that contains a section keyword
  // e.g. "WORK EXPERIENCE", "EDUCATION", "SKILLS & EXPERTISE"
  if (line === line.toUpperCase() && /[A-Z]/.test(line) && line.split(/\s+/).length <= 5) {
    const lower = line.toLowerCase().replace(/[^a-z\s&]/g, "").trim();
    for (const [name, re] of SECTIONS) {
      // Strip anchors from the regex and test the lowercase line
      if (re.test(lower)) return name;
    }
  }
  return null;
}

// ── Section splitter ──────────────────────────────────────────────────────────

interface Section { name: string; lines: string[] }

function splitSections(rawLines: string[]): { header: string[]; sections: Section[] } {
  const sections: Section[] = [];
  const header: string[] = [];
  let current: Section | null = null;
  let pastHeader = false;

  for (const raw of rawLines) {
    const line = raw.trim();
    if (!line) continue;

    const sectionName = isSectionHeader(line);
    if (sectionName) {
      pastHeader = true;
      if (current) sections.push(current);
      current = { name: sectionName, lines: [] };
      continue;
    }

    if (!pastHeader) {
      header.push(line);
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);
  return { header, sections };
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function extractDateRange(text: string): { startDate: string; endDate: string } | null {
  const m = DATE_RANGE_RE.exec(text);
  if (m) {
    const startMo = m[1] ? cap(m[1].slice(0, 3)) : "";
    const startYr = m[2];
    const endMo = m[3] ? cap(m[3].slice(0, 3)) : "";
    const endRaw = m[4] ?? "";
    const endDate = /present|current|now/i.test(endRaw)
      ? "Present"
      : endMo
      ? `${endMo} ${endRaw}`
      : endRaw;
    return {
      startDate: startMo ? `${startMo} ${startYr}` : startYr,
      endDate,
    };
  }
  return null;
}

function stripDates(text: string) {
  return text.replace(DATE_RANGE_RE, "").replace(/\s{2,}/g, " ").trim();
}

// ── Personal info ─────────────────────────────────────────────────────────────

function parsePersonalInfo(headerLines: string[], fullText: string) {
  const email = EMAIL_RE.exec(fullText)?.[0] ?? "";
  const phone = PHONE_RE.exec(fullText)?.[0]?.trim() ?? "";
  const linkedin = (() => {
    const m = LINKEDIN_RE.exec(fullText);
    return m ? `https://${m[0]}` : "";
  })();
  const website = (() => {
    const m = WEBSITE_RE.exec(fullText);
    return m ? m[0] : "";
  })();

  // Name = first non-contact line
  const nameLine = headerLines.find(
    (l) => !EMAIL_RE.test(l) && !PHONE_RE.test(l) && !LINKEDIN_RE.test(l) && l.length < 60
  ) ?? "";

  // Job title = second qualifying line
  const titleLine = headerLines.find(
    (l) =>
      l !== nameLine &&
      !EMAIL_RE.test(l) &&
      !PHONE_RE.test(l) &&
      !LINKEDIN_RE.test(l) &&
      !WEBSITE_RE.test(l) &&
      l.length < 80
  ) ?? "";

  // Location: "City, ST" or "City, Country"
  const locMatch = fullText.match(
    /\b([A-Z][a-z]+(?:[\s-][A-Z][a-z]+)*),\s*([A-Z]{2}|[A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b/
  );
  const location = locMatch ? locMatch[0] : "";

  return {
    fullName: nameLine,
    email,
    phone,
    location,
    linkedin,
    website,
    jobTitle: titleLine,
  };
}

// ── Experience parser ─────────────────────────────────────────────────────────

/** Escape HTML special chars in plain text before embedding in HTML */
function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Convert an array of plain-text bullets to a Tiptap-compatible HTML string */
function bulletsToHtml(bullets: string[]): string {
  if (!bullets.length) return "";
  return `<ul>${bullets.map((b) => `<li><p>${escHtml(b)}</p></li>`).join("")}</ul>`;
}

function parseExperience(lines: string[]): WorkExp[] {
  const entries: WorkExp[] = [];
  let cur: Omit<WorkExp, "description"> & { _bullets: string[] } | null = null;

  const flush = () => {
    if (cur) {
      entries.push({ ...cur, description: bulletsToHtml(cur._bullets) });
    }
    cur = null;
  };

  for (const line of lines) {
    const dates = extractDateRange(line);
    const isBullet = BULLET_RE.test(line);

    if (dates && !isBullet) {
      // New experience entry
      flush();
      const rest = stripDates(line).replace(/[|,·•–-]+$/, "").trim();
      // Try "Title | Company" or "Title, Company" or "Title at Company"
      const split = rest.split(/\s*[|,]\s*|\s+at\s+/i);
      cur = {
        id: uid(),
        title: split[0]?.trim() ?? "",
        company: split[1]?.trim() ?? "",
        location: split[2]?.trim() ?? "",
        startDate: dates.startDate,
        endDate: dates.endDate,
        _bullets: [],
      };
    } else if (cur) {
      if (isBullet) {
        cur._bullets.push(line.replace(BULLET_RE, "").trim());
      } else if (!cur.company && line.length < 80 && !EMAIL_RE.test(line)) {
        // Second line after date line → likely company name
        cur.company = line;
      } else if (!cur.title && line.length < 80) {
        cur.title = line;
      } else if (line.length > 40) {
        // Long non-bullet line — treat as a bullet (some PDFs strip bullet chars)
        cur._bullets.push(line);
      }
    }
  }
  flush();
  return entries;
}

// ── Education parser ──────────────────────────────────────────────────────────

function parseEducation(lines: string[]): Edu[] {
  const entries: Edu[] = [];
  let cur: Edu | null = null;

  const flush = () => {
    if (cur && (cur.institution || cur.degree)) entries.push(cur);
    cur = null;
  };

  for (const line of lines) {
    const dates = extractDateRange(line);
    const hasDegree = DEGREE_RE.test(line);

    if (dates || hasDegree) {
      flush();
      const rest = stripDates(line).replace(/[,–-]+$/, "").trim();
      const degMatch = DEGREE_RE.exec(rest);

      let institution = "";
      let degree = "";
      let field = "";

      if (degMatch) {
        const idx = rest.toLowerCase().indexOf(degMatch[0].toLowerCase());
        institution = rest.slice(0, idx).replace(/[,–-]+$/, "").trim();
        degree = rest.slice(idx).trim();
        const fieldM = degree.match(/\b(?:in|of)\s+(.+)/i);
        if (fieldM) field = fieldM[1].trim();
      } else {
        institution = rest;
      }

      cur = {
        id: uid(),
        institution,
        degree,
        field,
        startDate: dates?.startDate ?? "",
        endDate: dates?.endDate ?? "",
        gpa: "",
        honors: "",
      };
    } else if (cur) {
      const gpa = GPA_RE.exec(line);
      if (gpa) {
        cur.gpa = gpa[1];
      } else if (HONORS_RE.test(line)) {
        cur.honors = line;
      } else if (!cur.institution && line.length < 80) {
        cur.institution = line;
      } else if (!cur.degree && DEGREE_RE.test(line)) {
        cur.degree = line;
      }
    }
  }
  flush();
  return entries;
}

// ── Skills parser ─────────────────────────────────────────────────────────────

function parseSkills(lines: string[]): string[] {
  const skills: string[] = [];
  for (const line of lines) {
    // Handle "Category: skill1, skill2" format
    const colonIdx = line.indexOf(":");
    const content = colonIdx !== -1 ? line.slice(colonIdx + 1) : line;
    const parts = content.split(/[,|•·▪;]+/).map((s) => s.trim()).filter(Boolean);
    skills.push(...parts);
  }
  return [...new Set(skills)].filter((s) => s.length > 1 && s.length < 60);
}

// ── Certifications parser ─────────────────────────────────────────────────────

function parseCertifications(lines: string[]): Cert[] {
  return lines
    .filter((l) => l.length > 3)
    .map((line) => {
      const yearMatch = YEAR_RE.exec(line);
      const date = yearMatch ? yearMatch[0] : "";
      const name = line.replace(date, "").replace(/[-–|,·]+$/, "").trim();
      return { id: uid(), name, issuer: "", date };
    });
}

// ── Summary parser ────────────────────────────────────────────────────────────

function parseSummary(lines: string[]): string {
  return lines.join(" ").replace(/\s+/g, " ").trim();
}

// ── Main export ───────────────────────────────────────────────────────────────

export function parseResume(text: string): ParsedResume {
  const rawLines = text.split(/\r?\n/);
  const { header, sections } = splitSections(rawLines);

  const get = (name: string) => sections.find((s) => s.name === name)?.lines ?? [];

  const personalInfo = parsePersonalInfo(header, text);

  return {
    personalInfo,
    summary: parseSummary(get("summary")),
    workExperience: parseExperience(get("experience")),
    education: parseEducation(get("education")),
    skills: parseSkills(get("skills")),
    certifications: parseCertifications(get("certifications")),
    targetRole: personalInfo.jobTitle,
  };
}

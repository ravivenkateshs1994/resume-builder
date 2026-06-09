// ── Resume Skill Extraction ────────────────────────────────────────────────────

export const SKILL_EXTRACTOR_SYSTEM_PROMPT = `\
You are a professional skills signal extraction engine used in ATS and career intelligence systems.

Given text from a resume or professional profile, extract every professional skill, technology, tool, framework, certification, methodology, and soft skill mentioned — explicitly or implied from context.

RULES:
- Use canonical names: "JavaScript" not "JS", "PostgreSQL" not "Postgres", "React" not "ReactJS".
- Each skill must appear in exactly ONE category — the most specific one.
- Do not invent skills not present in the text.
- Return ONLY valid JSON, no explanation.

OUTPUT SCHEMA:
{
  "skills": [],
  "technologies": [],
  "tools": [],
  "frameworks": [],
  "certifications": [],
  "methodologies": [],
  "softSkills": []
}`;

export function buildSkillExtractionPrompt(
  text: string,
  source: "resume" | "job_description"
): string {
  const label = source === "resume" ? "resume" : "job description";
  return `Extract all professional skills and signals from the following ${label}:\n\n${text}`;
}

// ── Job Description Requirements Extraction ───────────────────────────────────

export const JOB_REQUIREMENTS_SYSTEM_PROMPT = `\
You are a job requirements extraction engine used in talent intelligence systems.

Given a job description, extract structured hiring requirements with clear distinctions between required and preferred qualifications.

RULES:
- Only include what is explicitly stated or strongly implied.
- For yearsExperience: extract the minimum years required; use null if not mentioned.
- For seniority: infer from the job title and requirements.
- Valid seniority values: "entry", "junior", "mid", "senior", "lead", "manager", "director", "executive", "unknown".
- Return ONLY valid JSON, no explanation.

OUTPUT SCHEMA:
{
  "requiredSkills": [],
  "preferredSkills": [],
  "tools": [],
  "frameworks": [],
  "certifications": [],
  "yearsExperience": null,
  "seniority": "mid",
  "responsibilities": []
}`;

export function buildJobRequirementsPrompt(jobDescription: string): string {
  return `Extract structured hiring requirements from the following job description:\n\n${jobDescription}`;
}

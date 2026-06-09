import type { CareerStage } from "@/types/careerStage";
import type { ResumeData } from "@/types/resume";
import type { CandidateProfile, JobExperienceLevel, JobPersona } from "@/types/jobs";

function normalizeStage(stage?: string): JobPersona {
  return stage === "EXPERIENCED" ? "EXPERIENCED" : "FRESHER";
}

function clean(value?: string | null): string {
  return (value ?? "").trim();
}

function parseYearMonth(value: string): number | null {
  const normalized = clean(value);
  if (!normalized) return null;

  const date = new Date(normalized);
  if (!Number.isNaN(date.getTime())) return date.getTime();

  const monthYear = normalized.match(/^([A-Za-z]{3,9})\s+(\d{4})$/);
  if (monthYear) {
    const parsed = new Date(`${monthYear[1]} 1, ${monthYear[2]}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
  }

  const numericYear = normalized.match(/^\d{4}$/);
  if (numericYear) {
    const parsed = new Date(`${normalized}-01-01`);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
  }

  return null;
}

function estimateMonths(startDate?: string, endDate?: string): number {
  const start = parseYearMonth(startDate ?? "");
  if (!start) return 0;

  const normalizedEnd = clean(endDate);
  const end = /present/i.test(normalizedEnd) || !normalizedEnd ? Date.now() : parseYearMonth(normalizedEnd) ?? Date.now();
  const diff = Math.max(0, end - start);
  return diff / (1000 * 60 * 60 * 24 * 30.4375);
}

function inferEducationSummary(resumeData: ResumeData): string[] {
  return resumeData.education
    .map((entry) => [entry.degree, entry.field, entry.institution].map(clean).filter(Boolean).join(" "))
    .filter(Boolean)
    .slice(0, 4);
}

function inferLeadershipSignals(resumeData: ResumeData): boolean {
  const text = [
    resumeData.summary,
    ...resumeData.workExperience.map((entry) => `${entry.title} ${entry.description} ${entry.company}`),
  ]
    .join(" ")
    .toLowerCase();

  return /\b(lead|led|mentor|manage|managed|owner|ownership|strategy|architect|architecture|head)\b/.test(text);
}

function inferProjectSignals(resumeData: ResumeData): boolean {
  const text = [
    resumeData.summary,
    ...resumeData.workExperience.map((entry) => `${entry.title} ${entry.description} ${entry.company}`),
    ...resumeData.education.map((entry) => `${entry.degree} ${entry.field} ${entry.honors}`),
  ]
    .join(" ")
    .toLowerCase();

  return /\b(project|hackathon|capstone|portfolio|built|developed|shipped|created|intern)\b/.test(text);
}

function inferInternshipSignals(resumeData: ResumeData): boolean {
  return resumeData.workExperience.some((entry) => /\b(intern|internship|trainee|apprentice)\b/i.test(`${entry.title} ${entry.company}`));
}

function inferYearsOfExperience(resumeData: ResumeData, stage: JobPersona): number {
  const months = resumeData.workExperience.reduce((total, entry) => total + estimateMonths(entry.startDate, entry.endDate), 0);
  const years = Math.round((months / 12) * 10) / 10;
  if (years > 0) {
    return years;
  }

  return stage === "EXPERIENCED" ? 2.0 : 0;
}

function inferSeniority(yearsOfExperience: number, stage: JobPersona): JobExperienceLevel {
  if (stage === "FRESHER") return "entry";
  if (yearsOfExperience < 1) return "entry";
  if (yearsOfExperience < 3) return "junior";
  if (yearsOfExperience < 6) return "mid";
  if (yearsOfExperience < 10) return "senior";
  if (yearsOfExperience < 15) return "lead";
  return "manager";
}

export function buildCandidateProfile(input: {
  resumeData: ResumeData;
  careerStage?: CareerStage | string | null;
}): CandidateProfile {
  const careerStage = normalizeStage(input.careerStage ?? undefined);
  const yearsOfExperience = inferYearsOfExperience(input.resumeData, careerStage);
  const topTitles = input.resumeData.workExperience.map((entry) => clean(entry.title)).filter(Boolean).slice(0, 5);
  const currentTitle = clean(input.resumeData.personalInfo.jobTitle) || topTitles[0] || clean(input.resumeData.targetRole);
  const skills = input.resumeData.skills.map(clean).filter(Boolean);

  return {
    careerStage,
    derivedSeniority: inferSeniority(yearsOfExperience, careerStage),
    yearsOfExperience,
    location: clean(input.resumeData.personalInfo.location),
    currentTitle,
    topTitles,
    skills,
    hasWorkExperience: input.resumeData.workExperience.length > 0,
    hasInternshipExperience: inferInternshipSignals(input.resumeData),
    hasProjects: inferProjectSignals(input.resumeData),
    hasLeadershipSignals: inferLeadershipSignals(input.resumeData),
    educationSummary: inferEducationSummary(input.resumeData),
    keywords: [clean(input.resumeData.targetRole), clean(input.resumeData.personalInfo.jobTitle), ...skills].filter(Boolean).slice(0, 20),
  };
}

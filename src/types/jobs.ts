import type { CareerStage } from "@/types/careerStage";

export type JobPersona = Extract<CareerStage, "FRESHER" | "EXPERIENCED">;

export type JobEmploymentType =
  | "internship"
  | "apprenticeship"
  | "trainee"
  | "part_time"
  | "contract"
  | "full_time";

export type JobExperienceLevel = "entry" | "junior" | "mid" | "senior" | "lead" | "manager";

export interface JobListing {
  id: string;
  source: "seed" | "manual" | "api" | "adzuna" | "muse";
  externalId?: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  employmentType: JobEmploymentType;
  experienceLevel: JobExperienceLevel;
  minYearsExperience?: number | null;
  maxYearsExperience?: number | null;
  industry?: string;
  description: string;
  applyUrl: string;
  skills: string[];
  preferredSkills: string[];
  tags: string[];
  postedAt: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  bestForStage: JobPersona[];
  featured?: boolean;
}

export interface CandidateProfile {
  careerStage: JobPersona;
  derivedSeniority: JobExperienceLevel;
  yearsOfExperience: number;
  location: string;
  currentTitle: string;
  topTitles: string[];
  skills: string[];
  hasWorkExperience: boolean;
  hasInternshipExperience: boolean;
  hasProjects: boolean;
  hasLeadershipSignals: boolean;
  educationSummary: string[];
  keywords: string[];
}

export interface RankedJobListing extends JobListing {
  matchScore: number;
  matchReasons: string[];
  matchSignals: {
    skillScore: number;
    experienceScore: number;
    titleScore: number;
    stageScore: number;
    locationScore: number;
  };
}

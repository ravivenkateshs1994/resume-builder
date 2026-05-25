// ─── Resume Data Types ────────────────────────────────────────────────────────

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  website?: string;
  jobTitle?: string;
  headshotUrl?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate: string; // "Present" or date string
  description: string; // HTML rich text (from Tiptap)
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  honors?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  credentialId?: string;
  validFrom?: string;
  validTo?: string;
  neverExpires?: boolean;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  targetRole: string;
  jobDescription?: string;
  summary: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications: Certification[];
}

// ─── Template Types ───────────────────────────────────────────────────────────

export type TemplateId =
  | "modern"
  | "classic"
  | "creative"
  | "minimal"
  | "executive"
  | "slate"
  | "chronos"
  | "terra"
  | "tech"
  | "nova"
  | "prism"
  | "apex";

// ─── Multi-Step Form Types ────────────────────────────────────────────────────

export type FormStep =
  | "personal"
  | "experience"
  | "education"
  | "skills"
  | "preview";



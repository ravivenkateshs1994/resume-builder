import type { CareerStage } from "@/types/careerStage";

export interface CareerStageConfigEntry {
  displayName: string;
  accent: string;
  heroTitle: string;
  heroSubtitle: string;
  primaryGoal: string;
  primaryHref: string;
  widgets: string[];
  homepageCards: string[];
  recommendations: string[];
  jobFeedTitle: string;
  jobFeedSubtitle: string;
}

export const careerStageConfig: Record<CareerStage, CareerStageConfigEntry> = {
  FRESHER: {
    displayName: "Fresher",
    accent: "indigo",
    heroTitle: "Launch Your Career",
    heroSubtitle: "Build ATS-ready resumes, improve interview skills and land your first role.",
    primaryGoal: "Build My Resume",
    primaryHref: "/create",
    widgets: ["Resume Score", "ATS Score", "Skill Gap Analysis", "Interview Readiness", "Resume Completion"],
    homepageCards: ["Build Resume", "ATS Analysis", "Mock Interview", "Explore Career Paths"],
    recommendations: ["Resume Builder", "ATS Optimization", "Mock Interviews", "Portfolio Building", "LinkedIn Setup"],
    jobFeedTitle: "Internships and entry-level roles",
    jobFeedSubtitle: "See fresh openings that match your current stage and resume signals.",
  },

  EXPERIENCED: {
    displayName: "Experienced",
    accent: "teal",
    heroTitle: "Accelerate Your Career Growth",
    heroSubtitle: "Identify skill gaps, improve market value and prepare for senior opportunities.",
    primaryGoal: "Explore Matching Jobs",
    primaryHref: "/jobs",
    widgets: ["Career Growth Score", "Skill Gap Analysis", "Leadership Readiness", "Promotion Readiness", "Market Demand Score"],
    homepageCards: ["Career Growth Analysis", "Promotion Readiness", "Leadership Assessment", "Salary Insights"],
    recommendations: ["System Design", "Architecture Skills", "Leadership", "Certifications", "Promotion Readiness"],
    jobFeedTitle: "Experienced roles and career moves",
    jobFeedSubtitle: "See full-time jobs ranked by resume fit, seniority alignment, and location match.",
  },

  JUNIOR: {
    displayName: "Junior",
    accent: "indigo",
    heroTitle: "Grow Your Skills",
    heroSubtitle: "Focus on foundational skills and early-career wins.",
    primaryGoal: "Improve Skills",
    primaryHref: "/create",
    widgets: [],
    homepageCards: [],
    recommendations: [],
    jobFeedTitle: "Entry-friendly opportunities",
    jobFeedSubtitle: "Explore roles designed for early career growth.",
  },

  MID_LEVEL: {
    displayName: "Mid-level",
    accent: "teal",
    heroTitle: "Advance Your Career",
    heroSubtitle: "Demonstrate depth and leadership in your specialization.",
    primaryGoal: "Advance",
    primaryHref: "/jobs",
    widgets: [],
    homepageCards: [],
    recommendations: [],
    jobFeedTitle: "Mid-level opportunities",
    jobFeedSubtitle: "Explore roles that fit your current skill level.",
  },

  SENIOR: {
    displayName: "Senior",
    accent: "teal",
    heroTitle: "Lead With Impact",
    heroSubtitle: "Strengthen leadership skills and strategic influence.",
    primaryGoal: "Leadership Development",
    primaryHref: "/jobs",
    widgets: [],
    homepageCards: [],
    recommendations: [],
    jobFeedTitle: "Leadership roles",
    jobFeedSubtitle: "Find roles that reward scope, ownership, and team impact.",
  },

  ARCHITECT: {
    displayName: "Architect",
    accent: "teal",
    heroTitle: "Architect Solutions",
    heroSubtitle: "Showcase system design and architecture leadership.",
    primaryGoal: "Design Systems",
    primaryHref: "/jobs",
    widgets: [],
    homepageCards: [],
    recommendations: [],
    jobFeedTitle: "Architecture and platform roles",
    jobFeedSubtitle: "Find roles that value design, scale, and technical direction.",
  },

  MANAGER: {
    displayName: "Manager",
    accent: "teal",
    heroTitle: "Lead Teams",
    heroSubtitle: "Build leadership influence and people management skills.",
    primaryGoal: "Team Leadership",
    primaryHref: "/jobs",
    widgets: [],
    homepageCards: [],
    recommendations: [],
    jobFeedTitle: "Management roles",
    jobFeedSubtitle: "Explore jobs that value execution, mentoring, and delivery.",
  },
};

export const ALL_CAREER_STAGES: CareerStage[] = Object.keys(careerStageConfig) as CareerStage[];

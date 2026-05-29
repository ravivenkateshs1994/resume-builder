import type { CareerStage } from "@/types/careerStage";

export interface CareerStageConfigEntry {
  displayName: string;
  accent: string;
  heroTitle: string;
  heroSubtitle: string;
  primaryGoal: string;
  widgets: string[];
  homepageCards: string[];
  recommendations: string[];
}

export const careerStageConfig: Record<CareerStage, CareerStageConfigEntry> = {
  FRESHER: {
    displayName: "Fresher",
    accent: "indigo",
    heroTitle: "Launch Your Career",
    heroSubtitle: "Build ATS-ready resumes, improve interview skills and land your first role.",
    primaryGoal: "Build My Resume",
    widgets: ["Resume Score", "ATS Score", "Skill Gap Analysis", "Interview Readiness", "Resume Completion"],
    homepageCards: ["Build Resume", "ATS Analysis", "Mock Interview", "Explore Career Paths"],
    recommendations: ["Resume Builder", "ATS Optimization", "Mock Interviews", "Portfolio Building", "LinkedIn Setup"],
  },

  EXPERIENCED: {
    displayName: "Experienced",
    accent: "teal",
    heroTitle: "Accelerate Your Career Growth",
    heroSubtitle: "Identify skill gaps, improve market value and prepare for senior opportunities.",
    primaryGoal: "Analyze Career Growth",
    widgets: ["Career Growth Score", "Skill Gap Analysis", "Leadership Readiness", "Promotion Readiness", "Market Demand Score"],
    homepageCards: ["Career Growth Analysis", "Promotion Readiness", "Leadership Assessment", "Salary Insights"],
    recommendations: ["System Design", "Architecture Skills", "Leadership", "Certifications", "Promotion Readiness"],
  },

  JUNIOR: {
    displayName: "Junior",
    accent: "indigo",
    heroTitle: "Grow Your Skills",
    heroSubtitle: "Focus on foundational skills and early-career wins.",
    primaryGoal: "Improve Skills",
    widgets: [],
    homepageCards: [],
    recommendations: [],
  },

  MID_LEVEL: {
    displayName: "Mid-level",
    accent: "teal",
    heroTitle: "Advance Your Career",
    heroSubtitle: "Demonstrate depth and leadership in your specialization.",
    primaryGoal: "Advance",
    widgets: [],
    homepageCards: [],
    recommendations: [],
  },

  SENIOR: {
    displayName: "Senior",
    accent: "teal",
    heroTitle: "Lead With Impact",
    heroSubtitle: "Strengthen leadership skills and strategic influence.",
    primaryGoal: "Leadership Development",
    widgets: [],
    homepageCards: [],
    recommendations: [],
  },

  ARCHITECT: {
    displayName: "Architect",
    accent: "teal",
    heroTitle: "Architect Solutions",
    heroSubtitle: "Showcase system design and architecture leadership.",
    primaryGoal: "Design Systems",
    widgets: [],
    homepageCards: [],
    recommendations: [],
  },

  MANAGER: {
    displayName: "Manager",
    accent: "teal",
    heroTitle: "Lead Teams",
    heroSubtitle: "Build leadership influence and people management skills.",
    primaryGoal: "Team Leadership",
    widgets: [],
    homepageCards: [],
    recommendations: [],
  },
};

export const ALL_CAREER_STAGES: CareerStage[] = Object.keys(careerStageConfig) as CareerStage[];

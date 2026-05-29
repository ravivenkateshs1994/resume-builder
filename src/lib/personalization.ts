import type { CareerStage } from "@/types/careerStage";
import { careerStageConfig, ALL_CAREER_STAGES } from "@/config/career-stage.config";

export interface DashboardExperience {
  heroTitle: string;
  heroSubtitle: string;
  primaryGoal: string;
  widgets: string[];
  recommendations: string[];
  accent?: string;
}

export function getDashboardExperience(stage?: CareerStage): DashboardExperience {
  const key = stage ?? (ALL_CAREER_STAGES.length > 0 ? ALL_CAREER_STAGES[0] : "FRESHER");
  const cfg = careerStageConfig[key] ?? careerStageConfig.FRESHER;
  return {
    heroTitle: cfg.heroTitle,
    heroSubtitle: cfg.heroSubtitle,
    primaryGoal: cfg.primaryGoal,
    widgets: cfg.widgets,
    recommendations: cfg.recommendations,
    accent: cfg.accent,
  };
}

export function getRecommendations(stage?: CareerStage): string[] {
  const key = stage ?? "FRESHER";
  return careerStageConfig[key]?.recommendations ?? careerStageConfig.FRESHER.recommendations;
}

export function getPrimaryCTA(stage?: CareerStage): string {
  const key = stage ?? "FRESHER";
  return careerStageConfig[key]?.primaryGoal ?? careerStageConfig.FRESHER.primaryGoal;
}

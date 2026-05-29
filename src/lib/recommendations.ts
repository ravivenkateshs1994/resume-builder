import type { CareerStage } from "@/types/careerStage";
import { careerStageConfig } from "@/config/career-stage.config";

export function getRecommendationsForStage(stage?: CareerStage): string[] {
  const key = stage ?? "FRESHER";
  return careerStageConfig[key]?.recommendations ?? careerStageConfig.FRESHER.recommendations;
}

export default getRecommendationsForStage;

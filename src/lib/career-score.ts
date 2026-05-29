import type { CareerStage } from "@/types/careerStage";

interface FresherMetrics {
  resumeQuality?: number;
  atsScore?: number;
  interviewReadiness?: number;
  skillCoverage?: number;
}

interface ExperiencedMetrics {
  skillDepth?: number;
  leadership?: number;
  marketRelevance?: number;
  certifications?: number;
  interviewReadiness?: number;
}

export function computeCareerScore(stage: CareerStage | undefined, metrics: any): number {
  if (!stage || stage === "FRESHER") {
    const m: FresherMetrics = metrics ?? {};
    const resumeQuality = (m.resumeQuality ?? 0);
    const atsScore = (m.atsScore ?? 0);
    const interviewReadiness = (m.interviewReadiness ?? 0);
    const skillCoverage = (m.skillCoverage ?? 0);
    const score = (resumeQuality * 0.25 + atsScore * 0.25 + interviewReadiness * 0.25 + skillCoverage * 0.25);
    return Math.round(Math.max(0, Math.min(100, score)));
  }

  // Experienced
  const em: ExperiencedMetrics = metrics ?? {};
  const skillDepth = (em.skillDepth ?? 0);
  const leadership = (em.leadership ?? 0);
  const marketRelevance = (em.marketRelevance ?? 0);
  const certifications = (em.certifications ?? 0);
  const interviewReadiness = (em.interviewReadiness ?? 0);

  const score = skillDepth * 0.3 + leadership * 0.25 + marketRelevance * 0.2 + certifications * 0.15 + interviewReadiness * 0.1;
  return Math.round(Math.max(0, Math.min(100, score)));
}

export default computeCareerScore;

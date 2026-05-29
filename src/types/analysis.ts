import type { ResumeData } from "@/types/resume";

export interface SavedAnalysisRecord {
  id: string;
  createdAt: string;
  targetRole: string;
  jobDescription?: string;
  resumeSnapshot: ResumeData;
  result: unknown;
}

export type PendingAnalysis = { jobDescription?: string; result?: unknown } | null;

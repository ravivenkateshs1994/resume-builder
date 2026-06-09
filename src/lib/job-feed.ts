import { canUseMuse, fetchMuseJobListings } from "@/lib/job-providers/muse";
import type { JobListing } from "@/types/jobs";
import type { CareerStage } from "@/types/careerStage";

function clean(value?: string | null): string {
  return (value ?? "").trim();
}

function normalizeKey(job: JobListing): string {
  return `${job.title}|${job.company}|${job.location}`.toLowerCase().replace(/\s+/g, " ").trim();
}

function dedupeJobListings(jobs: JobListing[]): JobListing[] {
  const seen = new Set<string>();
  const unique: JobListing[] = [];
  for (const job of jobs) {
    const key = job.externalId ? `${job.source}:${job.externalId}`.toLowerCase() : normalizeKey(job);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(job);
  }
  return unique;
}

export async function loadJobListings(options?: {
  query?: string;
  location?: string;
  careerStage?: CareerStage | string | null;
  limit?: number;
}): Promise<JobListing[]> {
  const limit = Math.max(1, Math.min(options?.limit ?? 20, 50));
  if (!canUseMuse()) return [];
  const jobs = await fetchMuseJobListings({
    query: clean(options?.query),
    location: clean(options?.location),
    careerStage: options?.careerStage,
    limit: Math.max(limit * 2, 20),
  }).catch(() => []);
  return dedupeJobListings(jobs).slice(0, Math.max(limit * 5, 100));
}


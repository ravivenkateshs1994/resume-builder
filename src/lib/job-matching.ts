import type { CandidateProfile, JobListing, RankedJobListing } from "@/types/jobs";

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function tokenise(text: string): string[] {
  return unique(text.toLowerCase().split(/[^a-z0-9+.#-]+/).filter(Boolean));
}

function overlapScore(source: string[], target: string[]): number {
  if (!source.length || !target.length) return 0;
  const sourceSet = new Set(source.map(normalize));
  const hits = target.filter((item) => sourceSet.has(normalize(item))).length;
  return hits / Math.max(1, target.length);
}

function matchLocation(candidate: CandidateProfile, job: JobListing): number {
  if (job.remote) return 100;
  if (!candidate.location) return 55;

  const candidateLocation = candidate.location.toLowerCase();
  const jobLocation = job.location.toLowerCase();
  if (candidateLocation && jobLocation && (jobLocation.includes(candidateLocation) || candidateLocation.includes(jobLocation))) {
    return 100;
  }

  if (jobLocation.includes("hybrid") || jobLocation.includes("remote")) return 85;
  return 45;
}

function matchExperience(candidate: CandidateProfile, job: JobListing): number {
  const years = candidate.yearsOfExperience;
  const min = job.minYearsExperience ?? 0;
  const max = job.maxYearsExperience ?? Math.max(min + 3, min + 1);

  if (years >= min && years <= max) return 100;
  if (years < min) {
    const gap = min - years;
    return clamp(100 - gap * 18);
  }

  if (years > max) {
    const gap = years - max;
    return clamp(100 - gap * 10);
  }

  return 70;
}

function matchStage(candidate: CandidateProfile, job: JobListing): number {
  const fresherFriendly = ["internship", "apprenticeship", "trainee"];
  if (candidate.careerStage === "FRESHER") {
    if (fresherFriendly.includes(job.employmentType) || job.bestForStage.includes("FRESHER")) return 100;
    if (job.experienceLevel === "entry" || job.experienceLevel === "junior") return 82;
    return 35;
  }

  if (job.employmentType === "full_time" && job.bestForStage.includes("EXPERIENCED")) return 100;
  if (job.experienceLevel === "mid" || job.experienceLevel === "senior" || job.experienceLevel === "lead") return 92;
  if (job.employmentType === "contract") return 78;
  if (fresherFriendly.includes(job.employmentType)) return 35;
  return 80;
}

function matchTitle(candidate: CandidateProfile, job: JobListing): number {
  const candidateTokens = tokenise([candidate.currentTitle, ...candidate.topTitles].join(" "));
  const jobTokens = tokenise([job.title, ...(job.tags ?? []), job.industry ?? ""].join(" "));
  if (!candidateTokens.length || !jobTokens.length) return 50;
  const hits = jobTokens.filter((token) => candidateTokens.includes(token)).length;
  return clamp((hits / Math.max(1, jobTokens.length)) * 100);
}

function matchSkills(candidate: CandidateProfile, job: JobListing): number {
  const base = unique([
    ...(job.skills ?? []),
    ...(job.preferredSkills ?? []),
    ...(job.tags ?? []),
  ]);
  const score = overlapScore(candidate.skills, base);
  return clamp(score * 100);
}

function hasRecentPosting(job: JobListing): number {
  const postedAt = new Date(job.postedAt);
  if (Number.isNaN(postedAt.getTime())) return 60;
  const ageDays = Math.max(0, (Date.now() - postedAt.getTime()) / (1000 * 60 * 60 * 24));
  if (ageDays <= 3) return 100;
  if (ageDays <= 7) return 88;
  if (ageDays <= 14) return 72;
  return 58;
}

function buildReasons(candidate: CandidateProfile, job: JobListing, signals: RankedJobListing["matchSignals"]): string[] {
  const reasons: string[] = [];

  if (signals.skillScore >= 75) {
    reasons.push(`Strong skill overlap with ${job.skills.slice(0, 4).join(", ")}.`);
  }

  if (candidate.careerStage === "FRESHER" && (job.employmentType === "internship" || job.employmentType === "trainee" || job.employmentType === "apprenticeship")) {
    reasons.push("This role is built for a fresher or first-job profile.");
  }

  if (candidate.careerStage === "EXPERIENCED" && job.employmentType === "full_time") {
    reasons.push("This is a full-time role aligned to an experienced profile.");
  }

  if (signals.experienceScore >= 80) {
    reasons.push(`Experience range matches the target ${job.experienceLevel} level.`);
  }

  if (signals.locationScore >= 85) {
    reasons.push(job.remote ? "Remote-friendly and easy to apply from anywhere." : `Location fit looks good for ${job.location}.`);
  }

  if (signals.titleScore >= 50) {
    reasons.push(`The title is close to your current direction: ${job.title}.`);
  }

  if (signals.stageScore >= 90 && candidate.careerStage === "FRESHER") {
    reasons.push("Internship/entry-level format fits your current stage.");
  }

  if (signals.stageScore >= 90 && candidate.careerStage === "EXPERIENCED") {
    reasons.push("This role looks suitable for a growth or switch move.");
  }

  return unique(reasons).slice(0, 4);
}

function buildRecommendation(job: JobListing, candidate: CandidateProfile): RankedJobListing {
  const matchSignals = {
    skillScore: matchSkills(candidate, job),
    experienceScore: matchExperience(candidate, job),
    titleScore: matchTitle(candidate, job),
    stageScore: matchStage(candidate, job),
    locationScore: matchLocation(candidate, job),
  };
  const freshnessScore = hasRecentPosting(job);

  const score = clamp(
    matchSignals.skillScore * 0.34 +
      matchSignals.experienceScore * 0.22 +
      matchSignals.stageScore * 0.2 +
      matchSignals.locationScore * 0.11 +
      matchSignals.titleScore * 0.11 +
      freshnessScore * 0.02
  );

  return {
    ...job,
    matchScore: score,
    matchSignals,
    matchReasons: [],
  };
}

export function filterJobListingsByQuery(jobs: JobListing[], query?: string): JobListing[] {
  const q = query?.trim().toLowerCase();
  if (!q) return jobs;
  const words = q.split(/[^a-z0-9+.#-]+/).filter(Boolean);
  if (!words.length) return jobs;

  return jobs.filter((job) => {
    const haystack = [
      job.title,
      job.company,
      job.location,
      job.description,
      job.industry ?? "",
      ...job.skills,
      ...job.preferredSkills,
      ...job.tags,
    ]
      .join(" ")
      .toLowerCase();

    return words.every((word) => haystack.includes(word));
  });
}

export function rankJobListings(
  candidate: CandidateProfile,
  jobs: JobListing[],
  options?: { limit?: number; query?: string }
): RankedJobListing[] {
  const filtered = filterJobListingsByQuery(jobs, options?.query);
  const ranked = filtered
    .map((job) => {
      const recommendation = buildRecommendation(job, candidate);
      recommendation.matchReasons = buildReasons(candidate, job, recommendation.matchSignals);
      return recommendation;
    })
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      const aFeatured = a.featured ? 1 : 0;
      const bFeatured = b.featured ? 1 : 0;
      if (bFeatured !== aFeatured) return bFeatured - aFeatured;
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
    });

  return ranked.slice(0, options?.limit ?? 8);
}

export function buildJobFeedSummary(candidate: CandidateProfile, jobs: RankedJobListing[]) {
  const fresherCount = jobs.filter((job) => job.bestForStage.includes("FRESHER")).length;
  const experiencedCount = jobs.filter((job) => job.bestForStage.includes("EXPERIENCED")).length;

  return {
    persona: candidate.careerStage,
    totalJobs: jobs.length,
    fresherCount,
    experiencedCount,
    topMatch: jobs[0] ?? null,
    stageLabel: candidate.careerStage === "FRESHER" ? "Internships and entry-level roles" : "Experienced roles and career moves",
  };
}

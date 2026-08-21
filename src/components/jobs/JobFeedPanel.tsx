"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, ExternalLink, Heart, Loader2, MapPin, Search, Sparkles, Wand2 } from "lucide-react";
import { useResumeStore } from "@/store/resumeStore";
import { useAnalysisStore } from "@/store/analysisStore";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import type { JobListing, RankedJobListing } from "@/types/jobs";

type JobFeedPayload = {
  recommendations: RankedJobListing[];
  summary?: {
    stageLabel?: string;
    totalJobs?: number;
    fresherCount?: number;
    experiencedCount?: number;
  };
};

function currencyLabel(job: JobListing): string {
  if (job.salaryMin == null && job.salaryMax == null) return "Salary not listed";
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: job.currency || "USD",
    maximumFractionDigits: 0,
  });
  if (job.salaryMin != null && job.salaryMax != null) {
    return `${formatter.format(job.salaryMin)} - ${formatter.format(job.salaryMax)}`;
  }
  if (job.salaryMin != null) return `From ${formatter.format(job.salaryMin)}`;
  return `Up to ${formatter.format(job.salaryMax ?? 0)}`;
}

export function JobFeedPanel({
  compact = false,
  showSearch = true,
  limit = compact ? 4 : 8,
  title = "Recommended jobs",
  description = "Ranked from your resume, experience stage, and role fit.",
}: {
  compact?: boolean;
  showSearch?: boolean;
  limit?: number;
  title?: string;
  description?: string;
}) {
  const router = useRouter();
  const { accessToken, isLoggedIn } = useSupabaseAuth();
  const { resumeData, careerStage } = useResumeStore();
  const setPendingAnalysis = useAnalysisStore((s) => s.setPendingAnalysis);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState(resumeData.personalInfo.location || "India");
  const [geoStatus, setGeoStatus] = useState<"idle" | "detecting" | "ready" | "error">("idle");
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [jobs, setJobs] = useState<RankedJobListing[]>([]);
  const [summary, setSummary] = useState<JobFeedPayload["summary"]>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const autoLocateAttempted = useRef(false);

  useEffect(() => {
    if (!location && resumeData.personalInfo.location) {
      setLocation(resumeData.personalInfo.location);
    }
  }, [location, resumeData.personalInfo.location]);

  const reverseGeocode = useCallback(async (latitude: number, longitude: number): Promise<string | null> => {
    const res = await fetch(`/api/location/reverse-geocode?lat=${encodeURIComponent(String(latitude))}&lon=${encodeURIComponent(String(longitude))}`);
    const payload = (await res.json().catch(() => null)) as { location?: string; displayName?: string } | null;
    if (!res.ok) {
      throw new Error(payload?.location || "Unable to resolve your location.");
    }

    return (payload?.location || payload?.displayName || "").trim() || null;
  }, []);

  const fetchApproximateLocation = useCallback(async (): Promise<string | null> => {
    const res = await fetch("/api/location/ip");
    const payload = (await res.json().catch(() => null)) as
      | { latitude?: number; longitude?: number; location?: string; city?: string; region?: string; country?: string }
      | null;

    if (!res.ok) {
      throw new Error(payload?.location || "Unable to approximate your location.");
    }

    if (typeof payload?.latitude === "number" && typeof payload?.longitude === "number") {
      try {
        const resolved = await reverseGeocode(payload.latitude, payload.longitude);
        if (resolved) return resolved;
      } catch {
        // fall through to the coarse IP result
      }
    }

    return (payload?.location || [payload?.city, payload?.region, payload?.country].filter(Boolean).join(", ")).trim() || null;
  }, [reverseGeocode]);

  const detectLocation = useCallback(async () => {
    if (geoStatus === "detecting") return;
    setGeoStatus("detecting");
    setGeoMessage(null);

    try {
      const browserLocation = await new Promise<string | null>((resolve, reject) => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
          resolve(null);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const resolved = await reverseGeocode(position.coords.latitude, position.coords.longitude);
              resolve(resolved);
            } catch (error) {
              reject(error);
            }
          },
          () => resolve(null),
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 1000 * 60 * 60 }
        );
      });

      const resolvedLocation = browserLocation || (await fetchApproximateLocation());
      if (resolvedLocation) {
        setLocation(resolvedLocation);
        setGeoStatus("ready");
        setGeoMessage(`Using ${resolvedLocation}.`);
        return;
      }

      throw new Error("We could not detect your location.");
    } catch (err) {
      setGeoStatus("error");
      setGeoMessage(err instanceof Error ? err.message : "Location detection failed.");
    }
  }, [fetchApproximateLocation, geoStatus, reverseGeocode]);

  useEffect(() => {
    if (autoLocateAttempted.current) return;
    if (location || resumeData.personalInfo.location) return;

    autoLocateAttempted.current = true;
    void detectLocation();
    // Only run once on mount so we do not repeatedly prompt the browser.
  }, [detectLocation, location, resumeData.personalInfo.location]);

  const stageLabel = useMemo(
    () => (careerStage === "FRESHER" ? "Internships and entry-level roles" : "Experienced roles and growth moves"),
    [careerStage]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/jobs/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeData,
            careerStage,
            query,
            location,
            limit,
          }),
        });

        const payload = (await res.json().catch(() => null)) as JobFeedPayload & { error?: string } | null;
        if (!res.ok) {
          throw new Error(payload?.error || "Failed to load job recommendations.");
        }

        if (!cancelled) {
          setJobs(Array.isArray(payload?.recommendations) ? payload!.recommendations : []);
          setSummary(payload?.summary ?? {});
        }
      } catch (err) {
        if (!cancelled) {
          setJobs([]);
          setSummary({});
          setError(err instanceof Error ? err.message : "Failed to load job recommendations.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [careerStage, limit, location, query, resumeData]);

  useEffect(() => {
    let cancelled = false;

    async function loadSavedJobs() {
      if (!accessToken) {
        setSavedKeys(new Set());
        return;
      }

      try {
        const res = await fetch("/api/jobs/saved", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const payload = await res.json().catch(() => null);
        if (!res.ok || cancelled) return;

        const keys = new Set<string>();
        for (const item of Array.isArray(payload?.jobs) ? payload.jobs : []) {
          if (typeof item?.jobKey === "string") keys.add(item.jobKey);
        }
        setSavedKeys(keys);
      } catch {
        if (!cancelled) setSavedKeys(new Set());
      }
    }

    void loadSavedJobs();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  async function saveJob(job: RankedJobListing) {
    if (!isLoggedIn || !accessToken) {
      router.push("/login");
      return;
    }

    const jobKey = `${job.source}:${job.id}`;
    setSavingKey(jobKey);
    try {
      const res = await fetch("/api/jobs/saved", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          job,
          matchScore: job.matchScore,
          matchReason: job.matchReasons?.[0] ?? "",
          status: "saved",
        }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error || "Failed to save job.");
      setSavedKeys((current) => new Set(current).add(jobKey));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save job.");
    } finally {
      setSavingKey(null);
    }
  }

  async function trackJob(job: RankedJobListing, eventType: string) {
    if (!isLoggedIn || !accessToken) return;

    try {
      await fetch("/api/jobs/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          job,
          eventType,
          payload: {
            stage: careerStage,
            matchScore: job.matchScore,
          },
        }),
      });
    } catch {
      // best effort only
    }
  }

  function openTailorFlow(job: RankedJobListing) {
    setPendingAnalysis({ jobDescription: job.description, result: null });
    void trackJob(job, "tailor");
    router.push("/gap-analysis/analysis");
  }

  const visibleJobs = jobs.slice(0, limit);

  return (
    <section className="rounded-[34px] border border-white/10 bg-slate-950/75 p-5 text-slate-100 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.58)] backdrop-blur md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">{summary?.stageLabel ?? stageLabel}</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">{description}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300">
            <BriefcaseBusiness className="h-3.5 w-3.5 text-slate-300" />
            {summary?.totalJobs ?? jobs.length} matches
          </div>
          <a
            href="https://www.adzuna.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-100"
          >
            Jobs by Adzuna
          </a>
          <Link href="/create" className="crp-btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm">
            <Wand2 className="h-4 w-4" />
            Tailor resume
          </Link>
        </div>
      </div>

      {showSearch && (
        <div className="mt-5 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <Search className="h-4 w-4 text-slate-300" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search role, company, or skill"
              className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <MapPin className="h-4 w-4 text-slate-300" />
            <input
              type="search"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={resumeData.personalInfo.location || "Enter a city, region, or country"}
              className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-400"
            />
            {resumeData.personalInfo.location && (
              <button
                type="button"
                onClick={() => setLocation(resumeData.personalInfo.location)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-100"
              >
                Use resume
              </button>
            )}
            <button
              type="button"
              onClick={() => void detectLocation()}
              disabled={geoStatus === "detecting"}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-100 disabled:opacity-60"
            >
              {geoStatus === "detecting" ? "Detecting..." : "Detect"}
            </button>
          </div>
          {geoMessage && (
            <p className={`text-xs ${geoStatus === "error" ? "text-rose-300" : "text-slate-300"}`}>{geoMessage}</p>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>
      )}

      <div className={compact ? "mt-5 grid gap-4" : "mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-2"}>
        {loading ? (
          <div className="col-span-full rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Finding your best matches...
            </span>
          </div>
        ) : visibleJobs.length > 0 ? (
          visibleJobs.map((job) => {
            const jobKey = `${job.source}:${job.id}`;
            const saved = savedKeys.has(jobKey);

            return (
              <article key={jobKey} className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_18px_55px_-40px_rgba(15,23,42,0.52)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{job.title}</h3>
                      <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100">
                        {job.matchScore}% match
                      </span>
                      {job.featured && (
                        <span className="rounded-full border border-emerald-300/35 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-300">
                      {job.company} - {job.location}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">{job.description}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {job.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="rounded-full border border-white/10 bg-slate-900/70 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">Compensation</p>
                    <p className="mt-1 text-sm font-semibold text-white">{currencyLabel(job)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">Why it matched</p>
                    <p className="mt-1 text-sm font-semibold text-white">{job.matchReasons[0] ?? "High relevance to your profile."}</p>
                  </div>
                </div>

                {job.matchReasons.length > 1 && (
                  <ul className="mt-4 space-y-2 text-sm text-slate-300">
                    {job.matchReasons.slice(1, 4).map((reason) => (
                      <li key={reason} className="flex items-start gap-2">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openTailorFlow(job)}
                    className="crp-btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm"
                  >
                    <Wand2 className="h-4 w-4" />
                    Tailor resume
                  </button>
                  <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => void trackJob(job, "click")}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-300/40 hover:text-cyan-100"
                  >
                    Open listing
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => void saveJob(job)}
                    disabled={savingKey === jobKey}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-rose-300/50 hover:text-rose-200 disabled:opacity-60"
                  >
                    <Heart className={`h-4 w-4 ${saved ? "fill-rose-500 text-rose-500" : ""}`} />
                    {savingKey === jobKey ? "Saving..." : saved ? "Saved" : "Save"}
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <div className="col-span-full rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
            No jobs matched your current search. Try a broader keyword or clear the search field.
          </div>
        )}
      </div>

      {!compact && (
        <div className="mt-6 rounded-[24px] border border-indigo-300/30 bg-indigo-400/10 p-4 text-sm text-slate-200">
          <p className="font-semibold text-indigo-100">Stage-aware ranking is enabled.</p>
          <p className="mt-1 text-slate-300">
            Freshers see internships and entry-level roles first, while experienced users see full-time jobs ranked against their resume.
          </p>
          <p className="mt-2 text-slate-300">
            Live listings are pulled from Adzuna when keys are configured, then merged with your saved jobs and bundled fallback listings.
          </p>
        </div>
      )}
    </section>
  );
}

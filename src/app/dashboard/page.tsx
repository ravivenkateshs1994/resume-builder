"use client";

import { useEffect, useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useResumeStore } from "@/store/resumeStore";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import HeroCard from "@/components/dashboard/HeroCard";
import StatCards from "@/components/dashboard/StatCards";
import ResumeList from "@/components/dashboard/ResumeList";
import ResumePreview from "@/components/dashboard/ResumePreview";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import EmptyState from "@/components/dashboard/EmptyState";
import type { ResumeData } from "@/types/resume";

export default function DashboardPage() {
  const { accessToken, userEmail, isLoggedIn, userFullName } = useSupabaseAuth();
  const router = useRouter();
  const { setResumeData, setUploadedResume, setPendingAnalysis } = useResumeStore();

  const [tab, setTab] = useState<'resumes' | 'analysis'>('resumes');

  const [query, setQuery] = useState("");
  const [resumes, setResumes] = useState<{
    id: string;
    title: string;
    createdAt: string;
    resumeData: ResumeData;
  }[]>([]);
  const [analysis, setanalysis] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [resumesError, setResumesError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type?: "info" | "success" | "error" } | null>(null);
  const [confirm, setConfirm] = useState<null | { id?: string; type: "import-resume" | "delete-resume" | "delete-analysis"; message: string }>(null);
  useEffect(() => {
    if (!isLoggedIn) return;
    // load both lists independently so errors show per-tab
    let cancelled = false;
    setLoading(true);
    setResumesError(null);
    setAuthRequired(false);

    (async () => {
      try {
        const rRes = await fetch("/api/cloud/resumes", { headers: { Authorization: `Bearer ${accessToken}` } });
        if (cancelled) return;
        if (!rRes.ok) {
          if (rRes.status === 401) {
            setAuthRequired(true);
            setResumesError("Authentication required — please sign in.");
          } else {
            try {
              const payload = await rRes.json().catch(() => null);
              setResumesError(payload?.error || "Failed to load resumes");
            } catch {
              setResumesError("Failed to load resumes");
            }
          }
        } else {
          const rJson = await rRes.json();
          setResumes(Array.isArray(rJson.resumes) ? rJson.resumes : []);
        }
      } catch (err) {
        if (!cancelled) setResumesError(err instanceof Error ? err.message : "Failed to load resumes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    (async () => {
      try {
        const aRes = await fetch("/api/cloud/analysis", { headers: { Authorization: `Bearer ${accessToken}` } });
        if (cancelled) return;
        if (!aRes.ok) {
          if (aRes.status === 401) {
            setAuthRequired(true);
            setToast({ message: "Authentication required — please sign in.", type: "error" });
            setTimeout(() => setToast(null), 5000);
          } else {
            try {
              const payload = await aRes.json().catch(() => null);
              setToast({ message: payload?.error || "Failed to load analysis", type: "error" });
              setTimeout(() => setToast(null), 5000);
            } catch {
              setToast({ message: "Failed to load analysis", type: "error" });
              setTimeout(() => setToast(null), 5000);
            }
          }
        } else {
          const aJson = await aRes.json();
          setanalysis(Array.isArray(aJson.analysis) ? aJson.analysis : []);
        }
      } catch (err) {
        if (!cancelled) {
          setToast({ message: err instanceof Error ? err.message : "Failed to load analysis", type: "error" });
          setTimeout(() => setToast(null), 5000);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, accessToken]);


  useEffect(() => {
    if (!isLoggedIn) return;
  }, [isLoggedIn]);

  useEffect(() => {
    // Auto-select the latest item for the active tab when none is selected
    if (selectedId) return;
    if (tab === 'resumes') {
      if (resumes.length > 0) {
        const latest = [...resumes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        if (latest) setSelectedId(latest.id);
      }
    } else {
      if (analysis.length > 0) {
        const latest = [...analysis].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        if (latest) setSelectedId(latest.id);
      }
    }
  }, [resumes, analysis, tab, selectedId]);

  function openResumeInBuilder(id: string) {
    const r = resumes.find((x) => x.id === id);
    if (!r) return;
    setResumeData(r.resumeData);
    router.push("/create");
  }

  return (
    <div className="crp-shell min-h-screen">
      <SiteHeader />
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 rounded-md px-4 py-2 text-sm shadow-lg ${toast.type === "error" ? "bg-red-600 text-white" : toast.type === "success" ? "bg-emerald-600 text-white" : "bg-slate-800 text-white"}`}>
          {toast.message}
        </div>
      )}
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">

        {/* Hero */}
        <HeroCard userName={userFullName ?? userEmail?.split("@")[0]} />

        {/* KPI Row */}
        <StatCards
          stats={[
            {
              label: "Total Resumes",
              value: resumes.length,
              trend: resumes.length > 0 ? { direction: "up", value: resumes.length } : undefined,
            },
            {
              label: "Avg ATS Score",
              value:
                analysis.length > 0
                  ? `${Math.round(
                      (analysis
                        .filter((a) => a.result?.score != null)
                        .reduce((s, a) => s + (a.result?.score ?? 0), 0) /
                        Math.max(1, analysis.filter((a) => a.result?.score != null).length)) * 100
                    )}%`
                  : "—",
            },
            {
              label: "Analysis Done",
              value: analysis.length,
              trend: analysis.length > 0 ? { direction: "up", value: analysis.length } : undefined,
            },
            {
              label: "Skills Missing",
              value: analysis.reduce(
                (acc, a) => acc + ((a.result?.missingSkills ?? []).length || 0),
                0
              ),
            },
          ]}
        />

        {/* Confirm modal */}
        {confirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <p className="mb-5 text-sm leading-relaxed text-slate-700">{confirm.message}</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirm(null)}
                  className="crp-btn-secondary px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const id = confirm.id;
                    const type = confirm.type;
                    setConfirm(null);
                    if (!id) return;

                    if (type === "import-resume") {
                      openResumeInBuilder(id);
                      setToast({ message: "Resume imported into builder.", type: "success" });
                      setTimeout(() => setToast(null), 3000);
                      return;
                    }

                    try {
                      if (type === "delete-resume") {
                        const res = await fetch(`/api/cloud/resumes/${encodeURIComponent(id)}`, {
                          method: "DELETE",
                          headers: { Authorization: `Bearer ${accessToken}` },
                        });
                        if (res.ok) {
                          setResumes((s) => s.filter((x) => x.id !== id));
                          setToast({ message: "Saved resume deleted.", type: "success" });
                        } else {
                          const payload = await res.json().catch(() => null);
                          setToast({ message: payload?.error || "Failed to delete resume.", type: "error" });
                        }
                      } else if (type === "delete-analysis") {
                        const res = await fetch(`/api/cloud/analysis/${encodeURIComponent(id)}`, {
                          method: "DELETE",
                          headers: { Authorization: `Bearer ${accessToken}` },
                        });
                        if (res.ok) {
                          setanalysis((s) => s.filter((x) => x.id !== id));
                          setToast({ message: "Analysis deleted.", type: "success" });
                          if (selectedId === id) setSelectedId(null);
                        } else {
                          const payload = await res.json().catch(() => null);
                          setToast({ message: payload?.error || "Failed to delete analysis.", type: "error" });
                        }
                      }
                    } catch {
                      setToast({ message: "Failed to perform action.", type: "error" });
                    }
                    setTimeout(() => setToast(null), 3000);
                  }}
                  className="crp-btn-primary px-4 py-2 text-sm font-semibold"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

          {/* Left — Resumes list */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <button onClick={() => setTab('resumes')} className={`rounded-full px-3 py-1 text-sm ${tab === 'resumes' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'}`}>
                Resumes
              </button>
              <button onClick={() => setTab('analysis')} className={`rounded-full px-3 py-1 text-sm ${tab === 'analysis' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'}`}>
                Analysis
              </button>
            </div>

            <ResumeList
              resumes={resumes}
              analyses={analysis}
              mode={tab}
              query={query}
              setQuery={setQuery}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id)}
              loading={loading}
            />

            {/* Auth / load errors */}
            {resumesError && (
              <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {resumesError}
                {authRequired && (
                  <button
                    onClick={() => router.push("/login")}
                    className="ml-3 underline"
                  >
                    Sign in
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right — AI Insights / Resume Preview + Activity */}
          <div className="flex flex-col gap-6 lg:col-span-3">
            {tab === 'resumes' ? (
              resumes.length === 0 && !loading ? (
                <EmptyState onCreate={() => router.push("/create")} />
              ) : (
                <ResumePreview
                  item={selectedId ? resumes.find((r) => r.id === selectedId) : undefined}
                  onOpen={() => {
                    const id = selectedId;
                    if (!id) return;
                    openResumeInBuilder(id);
                  }}
                />
              )
            ) : (
              // Analysis tab
              analysis.length === 0 && !loading ? (
                <div className="crp-card-soft p-8 text-center">
                  <h3 className="mb-2 text-lg font-semibold text-slate-900">No saved analysis yet</h3>
                  <p className="mb-4 text-sm text-slate-600">Analyze a job description to get AI-driven recommendations and ATS scores.</p>
                  <div className="flex justify-center">
                    <button onClick={() => router.push('/gap-analysis/analysis')} className="crp-btn-primary px-4 py-2">Create Analysis</button>
                  </div>
                </div>
              ) : (
                // show selected analysis details or prompt to select
                (selectedId == null) ? (
                  <div className="crp-card p-6 text-center text-slate-600">Select an analysis to view details.</div>
                ) : (() => {
                  const item = analysis.find(a => a.id === selectedId);
                  if (!item) return <div className="crp-card p-6 text-sm text-slate-500">Analysis not found.</div>;

                  const score = item.result?.score != null ? Math.round(item.result.score * 100) : null;
                  const missing: string[] = item.result?.missingSkills ?? [];
                  const recommendations: string[] = item.result?.recommendations ?? [];

                  return (
                    <div className="crp-card p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{item.targetRole || "Analysis"}</h3>
                          <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => {
                            try {
                              setUploadedResume({ label: `Cloud snapshot - ${new Date(item.createdAt).toLocaleDateString()}`, resumeData: item.resumeSnapshot });
                              setPendingAnalysis({ jobDescription: item.jobDescription, result: item.result });
                              router.push('/gap-analysis/analysis');
                            } catch {
                              setToast({ message: 'Failed to open analysis.', type: 'error' });
                              setTimeout(() => setToast(null), 3000);
                            }
                          }} className="crp-btn-primary px-3 py-1">Open</button>
                          <button onClick={() => setConfirm({ id: item.id, type: 'delete-analysis', message: 'Delete this analysis? This cannot be undone.' })} className="crp-btn-ghost px-3 py-1">Delete</button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="mb-2 font-semibold">Job description</p>
                        <div className="rounded-md border bg-slate-50 p-3 text-sm whitespace-pre-wrap max-h-56 overflow-auto">{item.jobDescription || "(none)"}</div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {score != null && (
                          <div className="crp-score-card p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Match score</p>
                            <p className={`mt-1 text-3xl font-extrabold ${score >= 70 ? 'text-emerald-600' : score >= 45 ? 'text-amber-600' : 'text-rose-500'}`}>{score}%</p>
                          </div>
                        )}

                        {missing.length > 0 && (
                          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-700">Missing skills</p>
                            <div className="flex flex-wrap gap-2">
                              {missing.map((sk, i) => <span key={i} className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">{sk}</span>)}
                            </div>
                          </div>
                        )}

                        {recommendations.length > 0 && (
                          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 sm:col-span-2">
                            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-indigo-700">Recommendations</p>
                            <ul className="space-y-1 text-sm text-slate-700">
                              {recommendations.map((r: any, i: number) => <li key={i}>→ {r}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
              )
            )}

            {/* Activity timeline (changes with active tab) */}
            <ActivityTimeline items={(tab === 'analysis' ? analysis : resumes).slice(0, 8)} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

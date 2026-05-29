"use client";

import { useEffect, useState } from "react";
import { BriefcaseBusiness } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useResumeStore } from "@/store/resumeStore";
import { useAnalysisStore } from "@/store/analysisStore";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import ResumeList from "@/components/dashboard/ResumeList";
import ResumePreview from "@/components/dashboard/ResumePreview";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import EmptyState from "@/components/dashboard/EmptyState";
import type { ResumeData } from "@/types/resume";
import CareerStageModal from "@/components/CareerStageModal";
import { getCareerStage } from "@/lib/careerStage";

function SideNav({
  name,
  email,
  tab,
  setTab,
  resumesCount = 0,
  analysisCount = 0,
  priorityActions = [],
  onDismissAction,
}: {
  name?: string | null;
  email?: string | null;
  tab: string;
  setTab: (t: any) => void;
  resumesCount?: number;
  analysisCount?: number;
  priorityActions?: { title: string; detail: string; cta: string; onClick: () => void }[];
  onDismissAction?: (title: string) => void;
}) {
  const initials = (name ?? email ?? "U").split(" ").map((n) => n[0] || "").join("").slice(0, 2).toUpperCase();

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold">{initials}</div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{name ?? (email ? email.split("@")[0] : "User")}</p>
            <p className="text-xs text-slate-500">Workspace</p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <button onClick={() => setTab('resumes')} className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded ${tab === 'resumes' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'}`}>
            <span>Resumes</span>
            <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{resumesCount}</span>
          </button>
          <button onClick={() => setTab('analysis')} className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded ${tab === 'analysis' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'}`}>
            <span>Analysis</span>
            <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{analysisCount}</span>
          </button>
        </div>
      </div>

      {priorityActions.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Priority</p>
          <div className="mt-3 flex flex-col gap-2">
            {priorityActions.map((a, i) => (
              <div key={`${a.title}-${i}`} className="rounded-md border border-slate-100 p-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{a.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{a.detail}</p>
                    <div className="mt-2">
                      <button onClick={a.onClick} className="crp-btn-primary px-3 py-1 text-xs">{a.cta}</button>
                      <button onClick={() => onDismissAction?.(a.title)} className="crp-btn-ghost ml-2 px-3 py-1 text-xs">Dismiss</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

function MobileNav({
  name,
  email,
  tab,
  setTab,
  resumesCount = 0,
  analysisCount = 0,
  priorityActions = [],
  onDismissAction,
}: {
  name?: string | null;
  email?: string | null;
  tab: string;
  setTab: (t: any) => void;
  resumesCount?: number;
  analysisCount?: number;
  priorityActions?: { title: string; detail: string; cta: string; onClick: () => void }[];
  onDismissAction?: (title: string) => void;
}) {
  const initials = (name ?? email ?? "U").split(" ").map((n) => n[0] || "").join("").slice(0, 2).toUpperCase();

  return (
    <section className="md:hidden space-y-3 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold">{initials}</div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{name ?? (email ? email.split("@")[0] : "User")}</p>
              <p className="text-xs text-slate-500">Workspace</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => setTab('resumes')} className={`flex items-center justify-between gap-3 rounded-2xl px-3 py-3 ${tab === 'resumes' ? 'bg-indigo-50 text-indigo-700 font-semibold ring-1 ring-indigo-100' : 'bg-slate-50 text-slate-600'}`}>
              <span>Resumes</span>
              <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{resumesCount}</span>
            </button>
            <button onClick={() => setTab('analysis')} className={`flex items-center justify-between gap-3 rounded-2xl px-3 py-3 ${tab === 'analysis' ? 'bg-indigo-50 text-indigo-700 font-semibold ring-1 ring-indigo-100' : 'bg-slate-50 text-slate-600'}`}>
              <span>Analysis</span>
              <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{analysisCount}</span>
            </button>
          </div>
        </div>

        {priorityActions.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase text-slate-500">Priority</p>
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Navigation</span>
            </div>
            <div className="mt-3 flex snap-x gap-3 overflow-x-auto pb-1">
              {priorityActions.map((a, i) => (
                <div key={`${a.title}-${i}`} className="min-w-[240px] snap-start rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">{a.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{a.detail}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={a.onClick} className="crp-btn-primary px-3 py-1 text-xs">{a.cta}</button>
                    <button onClick={() => onDismissAction?.(a.title)} className="crp-btn-ghost px-3 py-1 text-xs">Dismiss</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </section>
  );
}

// Score helper functions removed — metrics are computed elsewhere when needed

export default function DashboardPage() {
  const { accessToken, userEmail, isLoggedIn, userFullName, supabase, authReady } = useSupabaseAuth();
  const router = useRouter();
  const { setResumeData, setUploadedResume } = useResumeStore();
  const { setPendingAnalysis } = useAnalysisStore();

  const [showCareerModal, setShowCareerModal] = useState(false);

  useEffect(() => {
    if (!authReady) return;
    if (!isLoggedIn) return;
    if (!supabase) return;

    let cancelled = false;
    (async () => {
      const stage = await getCareerStage(supabase);
      if (cancelled) return;
      if (!stage) {
        setShowCareerModal(true);
      } else {
        useResumeStore.getState().setCareerStage(stage);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, isLoggedIn, supabase]);

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
  const [dismissedActions, setDismissedActions] = useState<string[]>([]);
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

  

  // overallScore removed (readiness panel hidden)

  const latestAnalysis = [...analysis]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  const latestMissingSkills: string[] = Array.isArray(latestAnalysis?.result?.missingSkills)
    ? latestAnalysis.result.missingSkills.slice(0, 3)
    : [];
  const latestRecommendations: string[] = Array.isArray(latestAnalysis?.result?.recommendations)
    ? latestAnalysis.result.recommendations.slice(0, 2)
    : [];

  const actionQueue = [
    !resumes.length
      ? {
          title: "Create your first tailored resume",
          detail: "Start a resume draft so your score and action plan can update from live data.",
          cta: "Create resume",
          onClick: () => router.push("/create"),
        }
      : null,
    latestMissingSkills[0]
      ? {
          title: `Add missing skill: ${latestMissingSkills[0]}`,
          detail: "Your latest analysis found a role-relevant gap that should be reflected in experience or skills.",
          cta: "Open analysis",
          onClick: () => router.push("/gap-analysis/analysis"),
        }
      : null,
    latestRecommendations[0]
      ? {
          title: "Apply your latest recommendation",
          detail: latestRecommendations[0],
          cta: "Review",
          onClick: () => router.push("/gap-analysis/analysis"),
        }
      : null,
    {
      title: "Keep your workspace current",
      detail: "Run a new analysis after each major edit so your ATS and readiness scores stay aligned.",
      cta: "New analysis",
      onClick: () => router.push("/gap-analysis/analysis"),
    },
  ].filter((item): item is NonNullable<typeof item> => item != null).slice(0, 4);

  const visibleActions = actionQueue.filter((a) => !dismissedActions.includes(a.title));

  // (stageStats removed — KPI cards were taken out per design)


  useEffect(() => {
    if (!isLoggedIn) return;
  }, [isLoggedIn]);

  useEffect(() => {
    // When the active tab changes or the lists load, auto-select the newest item
    if (tab === 'resumes') {
      if (resumes.length > 0) {
        const latest = [...resumes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        setSelectedId(latest.id);
      } else {
        setSelectedId(null);
      }
    } else {
      if (analysis.length > 0) {
        const latest = [...analysis].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        setSelectedId(latest.id);
      } else {
        setSelectedId(null);
      }
    }
  }, [tab, resumes, analysis]);

  function openResumeInBuilder(id: string) {
    const r = resumes.find((x) => x.id === id);
    if (!r) return;
    setResumeData(r.resumeData);
    router.push("/create");
  }

  return (
    <div className="crp-shell min-h-screen">
      <SiteHeader />
      {showCareerModal && (
        <CareerStageModal
          onComplete={(stage) => {
            useResumeStore.getState().setCareerStage(stage);
            setShowCareerModal(false);
          }}
        />
      )}
      {/* Toast — always-present region so screen readers announce changes */}
      <div
        aria-live={toast?.type === "error" ? "assertive" : "polite"}
        aria-atomic="true"
        role={toast?.type === "error" ? "alert" : "status"}
        className={`fixed top-6 right-6 z-50 rounded-md px-4 py-2 text-sm shadow-lg transition-opacity duration-200 ${
          toast
            ? toast.type === "error"
              ? "bg-red-600 text-white"
              : toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-slate-800 text-white"
            : "pointer-events-none opacity-0"
        }`}
      >
        {toast?.message ?? ""}
      </div>
      <main className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        <div className="space-y-4 md:hidden">
          <MobileNav
            name={userFullName ?? null}
            email={userEmail ?? null}
            tab={tab}
            setTab={setTab}
            resumesCount={resumes.length}
            analysisCount={analysis.length}
            priorityActions={visibleActions}
            onDismissAction={(title) => setDismissedActions((s) => [...s, title])}
          />
        </div>

        <div className="mt-5 flex flex-col gap-6 md:mt-0 md:flex-row">
          <SideNav
            name={userFullName ?? null}
            email={userEmail ?? null}
            tab={tab}
            setTab={setTab}
            resumesCount={resumes.length}
            analysisCount={analysis.length}
            priorityActions={visibleActions}
            onDismissAction={(title) => setDismissedActions((s) => [...s, title])}
          />
          <div className="flex-1 space-y-6">
        {/* Stats cards removed per request */}
        {confirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <p className="mb-5 text-sm leading-relaxed text-slate-700">{confirm.message}</p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirm(null)}
                  className="crp-btn-secondary px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
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

        <ScrollReveal delayMs={180}>
          {tab === 'resumes' ? (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Saved Resumes</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Saved resumes</h2>
                  <p className="mt-1 text-sm text-slate-600">Manage saved resumes and open them in the builder.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                  <BriefcaseBusiness className="h-3.5 w-3.5 text-slate-500" />
                  {resumes.length} resumes
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <div className="lg:col-span-2">
                  <ResumeList
                    resumes={resumes}
                    analyses={analysis}
                    mode={'resumes'}
                    query={query}
                    setQuery={setQuery}
                    selectedId={selectedId}
                    onSelect={(id) => setSelectedId(id)}
                    loading={loading}
                  />

                  {resumesError && (
                    <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {resumesError}
                      {authRequired && (
                          <button
                            type="button"
                            onClick={() => router.push("/login")}
                            className="ml-3 underline"
                          >
                            Sign in
                          </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-6 lg:col-span-3">
                  {resumes.length === 0 && !loading ? (
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
                  )}

                  <ActivityTimeline items={resumes.slice(0, 8)} />
                </div>
              </div>
            </section>
          ) : (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Saved analysis</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Saved analysis</h2>
                  <p className="mt-1 text-sm text-slate-600">Open previous analysis, re-run, or export them.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                  <BriefcaseBusiness className="h-3.5 w-3.5 text-slate-500" />
                  {analysis.length} analysis
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <div className="lg:col-span-2">
                  <ResumeList
                    resumes={resumes}
                    analyses={analysis}
                    mode={'analysis'}
                    query={query}
                    setQuery={setQuery}
                    selectedId={selectedId}
                    onSelect={(id) => setSelectedId(id)}
                    loading={loading}
                  />
                </div>

                <div className="flex flex-col gap-6 lg:col-span-3">
                  {analysis.length === 0 && !loading ? (
                    <div className="crp-card-soft p-8 text-center">
                      <h3 className="mb-2 text-lg font-semibold text-slate-900">No saved analysis yet</h3>
                      <p className="mb-4 text-sm text-slate-600">Analyze a job description to get AI-driven recommendations and ATS scores.</p>
                        <div className="flex justify-center">
                        <button type="button" onClick={() => router.push('/gap-analysis/analysis')} className="crp-btn-primary px-4 py-2">Create Analysis</button>
                      </div>
                    </div>
                  ) : (
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
                              <button type="button" onClick={() => {
                                try {
                                  setUploadedResume({ label: `Cloud snapshot - ${new Date(item.createdAt).toLocaleDateString()}`, resumeData: item.resumeSnapshot });
                                  setPendingAnalysis({ jobDescription: item.jobDescription, result: item.result });
                                  router.push('/gap-analysis/analysis');
                                } catch {
                                  setToast({ message: 'Failed to open analysis.', type: 'error' });
                                  setTimeout(() => setToast(null), 3000);
                                }
                              }} className="crp-btn-primary px-3 py-1">Open</button>
                              <button type="button" onClick={() => setConfirm({ id: item.id, type: 'delete-analysis', message: 'Delete this analysis? This cannot be undone.' })} className="crp-btn-ghost px-3 py-1">Delete</button>
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
                  )}

                  <ActivityTimeline items={analysis.slice(0, 8)} />
                </div>
              </div>
            </section>
          )}
        </ScrollReveal>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useResumeStore } from "@/store/resumeStore";
import { useRouter } from "next/navigation";
import DashboardItemCard from "@/components/DashboardItemCard";
import type { ResumeData } from "@/types/resume";

export default function DashboardPage() {
  const { accessToken, userEmail, isLoggedIn, signOut, authReady } = useSupabaseAuth();
  const router = useRouter();
  const { setResumeData, setUploadedResume, setPendingAnalysis } = useResumeStore();

  const [tab, setTab] = useState<"resumes" | "analysis">("resumes");
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
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type?: "info" | "success" | "error" } | null>(null);
  const [confirm, setConfirm] = useState<null | { id?: string; type: "import-resume" | "delete-resume" | "delete-analysis"; message: string }>(null);
  const [debugAuth, setDebugAuth] = useState(false);
  

  useEffect(() => {
    if (!isLoggedIn) return;
    // load both lists independently so errors show per-tab
    let cancelled = false;
    setLoading(true);
    setResumesError(null);
    setAnalysisError(null);
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
            } catch (e) {
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
            setAnalysisError("Authentication required — please sign in.");
          } else {
            try {
              const payload = await aRes.json().catch(() => null);
              setAnalysisError(payload?.error || "Failed to load analysis");
            } catch (e) {
              setAnalysisError("Failed to load analysis");
            }
          }
        } else {
          const aJson = await aRes.json();
          setanalysis(Array.isArray(aJson.analysis) ? aJson.analysis : []);
        }
      } catch (err) {
        if (!cancelled) setAnalysisError(err instanceof Error ? err.message : "Failed to load analysis");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, accessToken]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const qs = new URLSearchParams(window.location.search);
    setDebugAuth(qs.has("debugAuth"));
  }, []);

  function cleanJobDescription(text?: string) {
    if (!text) return "";
    // Remove leading 'Role Overview:' or similar prefixes
    return text.replace(/^\s*Role\s*Overview\s*[:\-–—]?\s*/i, "").trim();
  }

  useEffect(() => {
    if (!isLoggedIn) return;
  }, [isLoggedIn]);

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
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-slate-600">Welcome {userEmail ?? ""}. Manage your saved resumes and analysis here.</p>
            {debugAuth && (
              <div className="mt-2 rounded-md bg-slate-50 p-2 text-xs text-slate-700 border border-slate-100">
                <div>authReady: {String(authReady)}</div>
                <div>isLoggedIn: {String(isLoggedIn)}</div>
                <div>accessToken present: {accessToken ? `yes (len ${accessToken.length})` : "no"}</div>
                <div className="mt-1 text-xxs text-slate-400">(Enable by adding ?debugAuth=1 to the URL)</div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div>
              {tab === "resumes" ? (
                <button
                  onClick={() => router.push("/create")}
                  className="rounded-md bg-indigo-600 px-3 py-1 text-sm font-semibold text-white"
                >
                  Create Resume
                </button>
              ) : (
                <button
                  onClick={() => router.push("/gap-analysis/analysis")}
                  className="rounded-md bg-indigo-600 px-3 py-1 text-sm font-semibold text-white"
                >
                  Create Analysis
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Confirm modal */}
        {confirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded bg-white p-6">
              <p className="mb-4 text-sm text-slate-700">{confirm.message}</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirm(null)}
                  className="rounded-md border border-slate-200 bg-white px-3 py-1 text-sm"
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
                    } catch (e) {
                      setToast({ message: "Failed to perform action.", type: "error" });
                    }
                    setTimeout(() => setToast(null), 3000);
                  }}
                  className="rounded-md bg-indigo-600 px-3 py-1 text-sm font-semibold text-white"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4 rounded-lg border bg-white p-3">
          <nav className="flex gap-2">
            <button
              onClick={() => setTab("resumes")}
              className={`px-3 py-1 text-sm font-semibold ${tab === "resumes" ? "bg-indigo-50 text-indigo-700" : "text-slate-600"}`}
            >
              Resumes
            </button>
            <button
              onClick={() => setTab("analysis")}
              className={`px-3 py-1 text-sm font-semibold ${tab === "analysis" ? "bg-indigo-50 text-indigo-700" : "text-slate-600"}`}
            >
              Analysis
            </button>
          </nav>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-lg border bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">{tab === "resumes" ? "Saved Resumes" : "Saved analysis"}</h3>
              <div className="mb-3 flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={tab === 'resumes' ? 'Search resumes, names, skills...' : 'Search analysis, job titles...'}
                    className="w-full rounded-md border border-slate-200 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <div className="pointer-events-none absolute right-3 top-2 text-xs text-slate-400">⌕</div>
                </div>
                <div className="text-sm text-slate-500">{tab === 'resumes' ? resumes.length : analysis.length} items</div>
              </div>
              {loading && <p className="text-sm text-slate-500">Loading…</p>}
              {tab === "resumes" && resumesError && (
                <div className="space-y-2">
                  <p className="text-sm text-red-500">{resumesError}</p>
                  {authRequired && (
                    <div>
                      <button onClick={() => router.push('/login')} className="rounded-md bg-indigo-600 px-3 py-1 text-sm font-semibold text-white">Sign in</button>
                    </div>
                  )}
                </div>
              )}
              {tab === "analysis" && analysisError && (
                <div className="space-y-2">
                  <p className="text-sm text-red-500">{analysisError}</p>
                  {authRequired && (
                    <div>
                      <button onClick={() => router.push('/login')} className="rounded-md bg-indigo-600 px-3 py-1 text-sm font-semibold text-white">Sign in</button>
                    </div>
                  )}
                </div>
              )}
              {!loading && tab === "resumes" && (
                <div className="space-y-3">
                  {resumes.filter(r => {
                    if (!query) return true;
                    const q = query.toLowerCase();
                    return (r.title || '').toLowerCase().includes(q) || (r.resumeData.personalInfo?.fullName || '').toLowerCase().includes(q) || (r.resumeData.skills || []).join(' ').toLowerCase().includes(q);
                  }).map((r) => (
                    <DashboardItemCard
                      key={r.id}
                      id={r.id}
                      title={r.resumeData.personalInfo?.fullName || r.title}
                      meta={new Date(r.createdAt).toLocaleString()}
                      primaryLabel="Import"
                      onView={() => setSelectedId(r.id)}
                      onPrimary={() => setConfirm({ id: r.id, type: "import-resume", message: "Import this resume into the builder? Unsaved changes will be lost." })}
                      onDelete={() => setConfirm({ id: r.id, type: "delete-resume", message: "Delete this saved resume? This cannot be undone." })}
                    />
                  ))}
                  {resumes.length === 0 && !loading && <div className="text-sm text-slate-500">No saved resumes.</div>}
                </div>
              )}

              {!loading && tab === "analysis" && (
                <div className="space-y-3">
                  {analysis.filter(a => {
                    if (!query) return true;
                    const q = query.toLowerCase();
                    return (a.targetRole || '').toLowerCase().includes(q) || (a.jobDescription || '').toLowerCase().includes(q);
                  }).map((a) => (
                    <DashboardItemCard
                      key={a.id}
                      id={a.id}
                      title={a.targetRole || a.jobDescription}
                      meta={new Date(a.createdAt).toLocaleString()}
                      primaryLabel="Open"
                      onView={() => setSelectedId(a.id)}
                      onPrimary={() => {
                        try {
                          setUploadedResume({ label: `Cloud snapshot - ${new Date(a.createdAt).toLocaleDateString()}`, resumeData: a.resumeSnapshot });
                          setPendingAnalysis({ jobDescription: a.jobDescription, result: a.result });
                          router.push("/gap-analysis/analysis");
                        } catch (e) {
                          setToast({ message: "Failed to open analysis.", type: "error" });
                          setTimeout(() => setToast(null), 3000);
                        }
                      }}
                      onDelete={() => setConfirm({ id: a.id, type: "delete-analysis", message: "Delete this analysis? This cannot be undone." })}
                    />
                  ))}
                  {analysis.length === 0 && !loading && <div className="text-sm text-slate-500">No analysis yet.</div>}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow-sm min-h-[240px]">
              {selectedId == null && <div className="flex h-full items-center justify-center"><p className="text-sm text-slate-500">Select an item to view details.</p></div>}

              {selectedId != null && tab === "resumes" && (
                (() => {
                  const item = resumes.find((r) => r.id === selectedId);
                  if (!item) return <p className="text-sm text-slate-500">Resume not found.</p>;
                  return (
                    <div>
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <p className="text-xs text-slate-500">Saved {new Date(item.createdAt).toLocaleString()}</p>
                      <div className="mt-4 space-y-3">
                        <div className="text-sm text-slate-700">
                          <div className="font-semibold">{item.resumeData.personalInfo?.fullName || "—"}</div>
                          <div className="text-xs text-slate-500">{item.resumeData.personalInfo?.email || ""} {item.resumeData.personalInfo?.phone ? `· ${item.resumeData.personalInfo.phone}` : ""}</div>
                          <div className="mt-2 text-sm">{item.resumeData.summary || item.resumeData.targetRole || "No summary provided."}</div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <div className="mb-1 text-xs font-semibold text-slate-500">Top skills</div>
                            <div className="flex flex-wrap gap-2">
                              {(item.resumeData.skills ?? []).slice(0, 12).map((s: string, idx: number) => (
                                <span key={idx} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{s}</span>
                              ))}
                              {(item.resumeData.skills ?? []).length === 0 && <div className="text-xs text-slate-500">No skills listed.</div>}
                            </div>
                          </div>

                          <div>
                            <div className="mb-1 text-xs font-semibold text-slate-500">Experience</div>
                            <div className="text-xs text-slate-700">
                              {(item.resumeData.workExperience ?? []).slice(0, 6).map((w: any) => (
                                <div key={w.id} className="mb-1">
                                  <div className="font-medium">{w.title || ""} — {w.company || ""}</div>
                                  <div className="text-xs text-slate-500">{w.startDate || ""} {w.endDate ? `– ${w.endDate}` : ""}</div>
                                </div>
                              ))}
                              {(item.resumeData.workExperience ?? []).length === 0 && <div className="text-xs text-slate-500">No experience entries.</div>}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 text-xs text-slate-500">
                          <div>Education: {(item.resumeData.education ?? []).length} entries</div>
                          <div>Certifications: {(item.resumeData.certifications ?? []).length} entries</div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {selectedId != null && tab === "analysis" && (
                (() => {
                  const item = analysis.find((a) => a.id === selectedId);
                  if (!item) return <p className="text-sm text-slate-500">Analysis not found.</p>;
                  return (
                    <div>
                      <h3 className="text-lg font-semibold">{item.targetRole || "Analysis"}</h3>
                      <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                      <div className="mt-4 space-y-4">
                        <div>
                          <p className="mb-2 font-semibold">Job description</p>
                              <div className="rounded-md border bg-slate-50 p-3 text-xs whitespace-pre-wrap max-h-48 overflow-auto">{cleanJobDescription(item.jobDescription) || "(none)"}</div>
                        </div>

                        <div>
                          <p className="mb-2 font-semibold">AI Analysis</p>
                          {/* Friendly render of common result fields */}
                          {item.result?.recommendations && Array.isArray(item.result.recommendations) ? (
                            <ul className="list-inside list-disc text-sm">
                              {item.result.recommendations.map((rec: any, i: number) => (
                                <li key={i} className="text-sm text-slate-700">{rec}</li>
                              ))}
                            </ul>
                          ) : null}

                          {item.result?.missingSkills && Array.isArray(item.result.missingSkills) ? (
                            <div className="mt-2">
                              <div className="text-xs font-semibold text-slate-500">Missing skills</div>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {item.result.missingSkills.map((sk: string, i: number) => (
                                  <span key={i} className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">{sk}</span>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {item.result?.score != null && (
                            <div className="mt-3">
                              <div className="text-xs font-semibold text-slate-500">Match score</div>
                              <div className="text-lg font-bold text-emerald-700">{Math.round(item.result.score * 100)}%</div>
                            </div>
                          )}

                          {/* Fallback raw JSON if nothing matched */}
                          {!item.result?.recommendations && !item.result?.missingSkills && item.result && (
                            <pre className="mt-2 text-xs whitespace-pre-wrap max-h-72 overflow-auto">{JSON.stringify(item.result, null, 2)}</pre>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

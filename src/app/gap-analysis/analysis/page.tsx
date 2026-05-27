"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  BrainCircuit,
  Briefcase,
  Code2,
  ChevronDown,
  ChevronUp,
  FileText,
  GraduationCap,
  Loader2,
  PlayCircle,
  Sparkles,
  Trophy,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { parseResumeFile } from "@/lib/resumeFileParser";
import { useResumeStore, type SavedAnalysisRecord } from "@/store/resumeStore";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import Link from "next/link";

// Types

interface LearningResource {
  title: string;
  type: "course" | "video" | "docs" | "book" | "practice";
  platform: string;
  searchQuery: string;
}

interface Gap {
  id: string;
  category: string;
  item: string;
  importance: "high" | "medium" | "low";
  context: string;
  learningResources: LearningResource[];
  practicalPlan?: string[];
}

interface GapResult {
  overallScore?: number;
  atsCompatibilityScore?: number;
  jobMatchScore?: number;
  recruiterAppealScore?: number;
  atsScore: number;
  keywordScore: number;
  sectionScore: number;
  experienceScore: number;
  qualityScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  issues: string[];
  recommendations: string[];
  analysisSummary: string;
  matchScore: number;
  matchSummary: string;
  gaps: Gap[];
}

type GapStatus = "unknown" | "known" | "learning";

const DEFAULT_SAMPLE_ROLE = "Frontend Engineer";

function generateSampleJobDescription(inputRole?: string): string {
  const role = (inputRole || DEFAULT_SAMPLE_ROLE).trim();
  const roleKey = role.toLowerCase();

  if (roleKey.includes("frontend") || roleKey.includes("front end")) {
    return `We are hiring a ${role} with strong React, TypeScript, and Next.js experience. Candidates should be comfortable building responsive UI systems, collaborating with product and design, improving performance, and writing maintainable component architecture. Experience with testing, accessibility, and API integration is preferred.`;
  }

  if (roleKey.includes("backend") || roleKey.includes("back end")) {
    return `We are hiring a ${role} with strong Node.js, API design, and cloud deployment experience. Candidates should be comfortable designing scalable services, optimizing databases, implementing authentication and observability, and collaborating with frontend and DevOps teams. Experience with distributed systems, testing, and CI/CD is preferred.`;
  }

  if (roleKey.includes("full stack") || roleKey.includes("fullstack")) {
    return `We are hiring a ${role} with strong experience across React, TypeScript, Node.js, and modern cloud platforms. Candidates should be comfortable building end-to-end product features, designing APIs, integrating databases, and shipping performant user experiences. Experience with testing, system design, and CI/CD is preferred.`;
  }

  if (roleKey.includes("data") && roleKey.includes("analyst")) {
    return `We are hiring a ${role} with strong SQL, Excel, and BI dashboarding skills. Candidates should be comfortable defining KPIs, building reliable reports, analyzing trends, and presenting insights to cross-functional stakeholders. Experience with Python, experimentation analysis, and data storytelling is preferred.`;
  }

  if (roleKey.includes("data") && roleKey.includes("scientist")) {
    return `We are hiring a ${role} with strong Python, statistics, and machine learning experience. Candidates should be comfortable building predictive models, conducting experiments, preparing datasets, and communicating findings to product and business teams. Experience with MLOps, feature engineering, and cloud ML workflows is preferred.`;
  }

  if (roleKey.includes("product manager") || roleKey.includes("product owner")) {
    return `We are hiring a ${role} who can drive product strategy from discovery to launch. Candidates should be comfortable writing PRDs, prioritizing roadmaps, defining success metrics, and partnering with design, engineering, and go-to-market teams. Experience with user research, experimentation, and stakeholder management is preferred.`;
  }

  if (roleKey.includes("designer") || roleKey.includes("ux") || roleKey.includes("ui")) {
    return `We are hiring a ${role} with strong UX thinking, interaction design, and visual design skills. Candidates should be comfortable leading user research, building wireframes and high-fidelity prototypes, collaborating with product and engineering, and maintaining design systems. Experience with accessibility and usability testing is preferred.`;
  }

  if (roleKey.includes("devops") || roleKey.includes("site reliability") || roleKey.includes("sre")) {
    return `We are hiring a ${role} with strong cloud infrastructure, CI/CD, and observability experience. Candidates should be comfortable automating deployments, managing Kubernetes or containerized workloads, improving reliability, and strengthening incident response practices. Experience with security hardening and performance tuning is preferred.`;
  }

  if (roleKey.includes("qa") || roleKey.includes("quality assurance") || roleKey.includes("test engineer")) {
    return `We are hiring a ${role} with strong manual and automation testing experience. Candidates should be comfortable building test plans, writing API and UI automation suites, validating release quality, and partnering closely with developers throughout the SDLC. Experience with performance testing and CI integration is preferred.`;
  }

  if (roleKey.includes("marketing")) {
    return `We are hiring a ${role} with strong campaign strategy, analytics, and cross-channel execution skills. Candidates should be comfortable planning and running growth campaigns, optimizing funnels, collaborating with content and product teams, and presenting performance insights. Experience with lifecycle marketing and A/B testing is preferred.`;
  }

  return `We are hiring a ${role} who can drive measurable outcomes in a cross-functional environment. Candidates should be comfortable owning projects end-to-end, collaborating with stakeholders, using data to guide decisions, and communicating clearly across teams. Experience with modern tools, process improvement, and execution at scale is preferred.`;
}

// Helpers

function platformUrl(resource: LearningResource): string {
  const q = encodeURIComponent(resource.searchQuery);
  switch (resource.platform.toLowerCase()) {
    case "youtube":
      return `https://www.youtube.com/results?search_query=${q}`;
    case "coursera":
      return `https://www.coursera.org/search?query=${q}`;
    case "udemy":
      return `https://www.udemy.com/courses/search/?src=ukw&q=${q}`;
    case "edx":
      return `https://www.edx.org/search?q=${q}`;
    case "leetcode":
      return `https://leetcode.com/problemset/all/?search=${q}`;
    case "official docs":
    default:
      return `https://www.google.com/search?q=${q}`;
  }
}

const resourceIcon: Record<LearningResource["type"], LucideIcon> = {
  course: GraduationCap,
  video: PlayCircle,
  docs: FileText,
  book: BookOpen,
  practice: Code2,
};

const importanceColor: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};

const categoryIcon: Record<string, LucideIcon> = {
  "Technical Skill": Wrench,
  "Soft Skill": BrainCircuit,
  "Tool/Platform": Code2,
  Certification: Trophy,
  "Domain Knowledge": BookOpen,
  Experience: Briefcase,
};

export default function AnalysisWorkspacePage() {
  const { resumeData, uploadedResume, setUploadedResume, pendingAnalysis, setPendingAnalysis } = useResumeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [jobDescription, setJobDescription] = useState(resumeData.jobDescription || "");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<GapResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resumeUploadError, setResumeUploadError] = useState<string | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [generatingSampleJD, setGeneratingSampleJD] = useState(false);

  const [gapStatus, setGapStatus] = useState<Record<string, GapStatus>>({});
  const [expandedResources, setExpandedResources] = useState<Record<string, boolean>>({});
  const { accessToken } = useSupabaseAuth();

  const activeResumeData = uploadedResume?.resumeData ?? resumeData;
  
  const hasActiveResume = Boolean(activeResumeData && (activeResumeData.personalInfo?.fullName || activeResumeData.skills?.length));
  const usingUploadedResume = Boolean(uploadedResume);
  const roleForSampleJD = activeResumeData?.targetRole || activeResumeData?.personalInfo?.jobTitle || resumeData.targetRole || resumeData.personalInfo?.jobTitle || DEFAULT_SAMPLE_ROLE;


  // cloud history UI has been removed; server-side saving still occurs

  // Restore an analysis passed from the Dashboard via in-memory store (no localStorage)
  useEffect(() => {
    if (!pendingAnalysis) return;
    try {
      // uploadedResume may already be set by the Dashboard when navigating
      if (pendingAnalysis) {
        if (uploadedResume == null && pendingAnalysis) {
          // nothing to do; uploadedResume should be set concurrently by dashboard
        }
        if (pendingAnalysis.jobDescription) setJobDescription(pendingAnalysis.jobDescription);
        if (pendingAnalysis.result) setResult(pendingAnalysis.result as GapResult);
        setError(null);
        setResumeUploadError(null);
        setGapStatus({});
        setExpandedResources({});
      }
    } catch {
      // ignore
    } finally {
      setPendingAnalysis(null);
    }
  }, [pendingAnalysis, uploadedResume, setPendingAnalysis]);
  async function saveAnalysisToCloud(record: Omit<SavedAnalysisRecord, "id" | "createdAt">) {
    if (!accessToken) return;
    const res = await fetch("/api/cloud/analysis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(record),
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload?.error || "Failed to save cloud analysis.");
    // cloud history UI removed; no local state update needed here
    return payload.analysis as SavedAnalysisRecord;
  }

  function openResumePicker() {
    fileInputRef.current?.click();
  }

  async function generateAiSampleJD() {
    setGeneratingSampleJD(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: "sample-jd",
          role: roleForSampleJD,
          resumeData: activeResumeData,
        }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || "Failed to generate sample JD.");

      const sampleJD = (payload?.result || "").trim();
      if (!sampleJD) throw new Error("AI returned an empty sample JD.");
      setJobDescription(sampleJD);
    } catch (e) {
      setJobDescription(generateSampleJobDescription(roleForSampleJD));
      setError(e instanceof Error ? `${e.message} Loaded a fallback sample JD for now.` : "AI generation failed. Loaded a fallback sample JD.");
    } finally {
      setGeneratingSampleJD(false);
    }
  }

  async function analyze() {
    if (!jobDescription.trim()) return;
    if (!hasActiveResume) {
      setError("Upload a PDF or DOCX resume first, or build a resume in the app.");
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);
    setGapStatus({});
    setExpandedResources({});

    try {
      const res = await fetch("/api/gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData: activeResumeData, jobDescription }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Analysis failed");
      const data: GapResult = await res.json();
      setResult(data);
      const localRecord = {
        targetRole: roleForSampleJD,
        jobDescription,
        resumeSnapshot: activeResumeData,
        result: data,
      };
      // no local analysis history: analysis are saved directly to cloud when logged in
      try {
        await saveAnalysisToCloud(localRecord);
      } catch (cloudSaveError) {
        setError(
          cloudSaveError instanceof Error
            ? `Analysis complete, but cloud save failed: ${cloudSaveError.message}`
            : "Analysis complete, but cloud save failed."
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleResumeUpload(file: File) {
    setResumeUploadError(null);
    setError(null);
    setResult(null);
    setGapStatus({});
    setExpandedResources({});
    setResumeUploading(true);

    try {
      const parsedResume = await parseResumeFile(file);
      setUploadedResume({
        label: file.name,
        resumeData: parsedResume,
      });
    } catch (uploadError) {
      setResumeUploadError(uploadError instanceof Error ? uploadError.message : "Failed to read the file.");
    } finally {
      setResumeUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function setStatus(id: string, status: GapStatus) {
    setGapStatus((prev) => ({ ...prev, [id]: status }));
    if (status === "learning") setExpandedResources((prev) => ({ ...prev, [id]: true }));
  }

  function toggleResources(id: string) {
    setExpandedResources((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // previously-supported cloud history restore/delete functions removed

  return (
    <main className="min-h-screen crp-shell">
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-20">
        {/* Reuse the workspace UI from previous implementation (input panel, analyze, results) */}
        {/* For brevity this child page contains the interactive workspace identical to the previous page. */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Analysis Workspace</p>
            <h2 className="text-3xl font-extrabold text-slate-900">Upload a resume, paste a job description, and inspect the gaps.</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl">Use an existing PDF or DOCX, or the resume you are already building in the app. The analyzer works the same either way.</p>
          </div>
        </div>

        <div className="app-panel crp-module-accent crp-soft-radial rounded-[2rem] p-6 sm:p-8 mb-6">
          <div className="mb-4 rounded-xl border border-slate-200 bg-white/80 p-4 crp-glass">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resume Source</p>
                <div className="mt-1 flex items-center gap-2">
                  {hasActiveResume ? (
                    <div className="flex items-center gap-2 text-slate-900 font-medium">
                      <div className="p-1.5 bg-blue-50 rounded-md">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="truncate max-w-[200px] sm:max-w-[400px]">
                        {usingUploadedResume
                          ? (uploadedResume?.resumeData?.personalInfo?.fullName || uploadedResume?.label || "Uploaded Resume")
                          : (resumeData.personalInfo.fullName || "In-app Resume")}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 uppercase tracking-tight font-bold">No resume selected</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={openResumePicker}
                  disabled={resumeUploading}
                  className={`inline-flex items-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all ${
                    hasActiveResume
                      ? "text-blue-600 hover:text-blue-700 bg-white border border-slate-200 px-3 shadow-sm hover:border-slate-300"
                      : "bg-blue-600 px-4 text-white hover:bg-blue-700 shadow-md"
                  } disabled:opacity-50`}
                >
                  {resumeUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Parsing...
                    </>
                  ) : hasActiveResume ? (
                    "Change"
                  ) : (
                    "Upload existing resume"
                  )}
                </button>

                {usingUploadedResume && (
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedResume(null);
                      setResumeUploadError(null);
                      setResult(null);
                      setGapStatus({});
                      setExpandedResources({});
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Use app draft
                  </button>
                )}
              </div>
            </div>

            {resumeUploadError && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {resumeUploadError}
              </p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void handleResumeUpload(file);
                }
                e.target.value = "";
              }}
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Job Description</label>
            <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={8} placeholder="Paste the full job description here - the more detail, the better the analysis." className="crp-textarea resize-none" />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400">{jobDescription.length} characters</p>
              <button
                type="button"
                onClick={() => void generateAiSampleJD()}
                disabled={generatingSampleJD}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generatingSampleJD ? "Generating..." : "Use Sample JD"}
              </button>
            </div>
          </div>

          <button onClick={analyze} disabled={analyzing || resumeUploading || !jobDescription.trim() || !hasActiveResume} className="crp-btn-primary flex items-center gap-2 disabled:opacity-40 px-6 py-2.5 text-sm">
            {analyzing ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Analyzing Gaps...</span> : <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4" />Analyze Gaps</span>}
          </button>
        </div>

        {/* Analysis history removed from UI */}

        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
        {result && (
          <section className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ATS Score</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">{result.atsScore}</p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Keyword Score</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">{result.keywordScore}</p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Section Score</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">{result.sectionScore}</p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Experience Score</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">{result.experienceScore}</p>
              </article>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">Analysis Summary</h3>
              <p className="mt-2 text-sm text-slate-700">{result.analysisSummary || result.matchSummary}</p>
              {result.recommendations?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top Recommendations</p>
                  <ul className="mt-2 space-y-2">
                    {result.recommendations.slice(0, 5).map((rec) => (
                      <li key={rec} className="text-sm text-slate-700 flex items-start gap-2">
                        <ArrowRight className="mt-0.5 h-4 w-4 text-indigo-600 shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-extrabold text-slate-900">Gap Breakdown</h3>
              {result.gaps?.length ? (
                result.gaps.map((gap) => {
                  const Icon = categoryIcon[gap.category] ?? BadgeCheck;
                  const status = gapStatus[gap.id] ?? "unknown";
                  const resourcesOpen = expandedResources[gap.id] ?? false;
                  return (
                    <article key={gap.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-indigo-600" />
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{gap.category}</p>
                          </div>
                          <h4 className="mt-1 text-base font-bold text-slate-900">{gap.item}</h4>
                          <p className="mt-2 text-sm text-slate-600">{gap.context}</p>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${importanceColor[gap.importance] ?? importanceColor.low}`}>
                          {gap.importance}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => setStatus(gap.id, "known")} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${status === "known" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Known</button>
                        <button type="button" onClick={() => setStatus(gap.id, "learning")} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${status === "learning" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Learning</button>
                        <button type="button" onClick={() => setStatus(gap.id, "unknown")} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${status === "unknown" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Unknown</button>
                      </div>

                      {gap.practicalPlan?.length ? (
                        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Practical Weekly Plan</p>
                          <ul className="mt-2 space-y-1.5">
                            {gap.practicalPlan.map((step) => (
                              <li key={`${gap.id}-${step}`} className="text-sm text-slate-700 flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {gap.learningResources?.length > 0 && (
                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <button
                            type="button"
                            onClick={() => toggleResources(gap.id)}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                          >
                            Learning resources ({gap.learningResources.length})
                            {resourcesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>

                          {resourcesOpen && (
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              {gap.learningResources.map((resource) => {
                                const ResourceIcon = resourceIcon[resource.type] ?? FileText;
                                return (
                                  <a
                                    key={`${gap.id}-${resource.title}`}
                                    href={platformUrl(resource)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-indigo-200 hover:bg-indigo-50"
                                  >
                                    <div className="flex items-center gap-2">
                                      <ResourceIcon className="h-4 w-4 text-indigo-600" />
                                      <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700">{resource.title}</p>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">{resource.platform}</p>
                                  </a>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">No explicit gaps were returned for this resume and job description pair.</div>
              )}
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
              <Link href="/create" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-800">
                Apply improvements in Resume Builder
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        )}

      </div>
    </main>
  );
}

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
  ShieldCheck,
  Sparkles,
  Trophy,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { parseResumeFile } from "@/lib/resumeFileParser";
import { useResumeStore } from "@/store/resumeStore";
import { useAnalysisStore } from "@/store/analysisStore";
import type { SavedAnalysisRecord } from "@/types/analysis";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import Link from "next/link";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

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
  const { resumeData, uploadedResume, setUploadedResume } = useResumeStore();
  const { pendingAnalysis, setPendingAnalysis } = useAnalysisStore();
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
  const [statusAnnouncement, setStatusAnnouncement] = useState("");
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
    setStatusAnnouncement(`Skill marked as ${status}.`);
    setTimeout(() => setStatusAnnouncement(""), 2000);
  }

  function toggleResources(id: string) {
    setExpandedResources((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // previously-supported cloud history restore/delete functions removed

  return (
    <main className="crp-shell min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_26%,#f8fafc_100%)] text-sm md:text-base">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {statusAnnouncement}
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-24 pt-12 sm:px-6 lg:pt-16">
        <ScrollReveal delayMs={40}>
          <section className="overflow-hidden rounded-[36px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_28%),linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] p-6 shadow-[0_28px_80px_-48px_rgba(15,23,42,0.32)] md:p-8 lg:p-10">
            <div className="grid gap-8 xl:grid-cols-[1.02fr_0.98fr] xl:items-start">
              <div>
                <span className="crp-badge">Analysis Workspace</span>
                <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl lg:leading-[1.02]">
                  Analyze the role gap before rewriting your resume.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
                  Upload your resume, paste the target job description, and get a focused read on missing skills, weak proof points, and the next edits worth making.
                </p>

                <div className="mt-8 flex flex-wrap gap-2">
                  {[
                    hasActiveResume ? "Resume loaded" : "Resume required",
                    jobDescription.trim() ? "Job description ready" : "Paste target role",
                    result ? "Analysis available" : "Awaiting analysis",
                  ].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-slate-200 bg-white/85 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[30px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_34px_80px_-46px_rgba(15,23,42,0.68)] md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">Workspace status</p>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight">Live analysis context</h2>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-100">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Resume source</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {hasActiveResume
                        ? usingUploadedResume
                          ? uploadedResume?.resumeData?.personalInfo?.fullName || uploadedResume?.label || "Uploaded resume"
                          : resumeData.personalInfo.fullName || "In-app resume"
                        : "No resume selected"}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-300">
                      {hasActiveResume
                        ? "The current resume will be compared against the role requirements below."
                        : "Upload a PDF or DOCX, or use the current in-app draft before running analysis."}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { label: "Input quality", value: jobDescription.trim() ? "Ready" : "Waiting" },
                      { label: "Resume state", value: hasActiveResume ? "Loaded" : "Missing" },
                      { label: "Output", value: result ? "Generated" : "Pending" },
                    ].map((item, index) => (
                      <div
                        key={item.label}
                        className="crp-story-card rounded-[22px] border border-white/10 bg-white/5 p-3"
                        style={{ animationDelay: `${index * 110}ms` }}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                        <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[24px] border border-emerald-400/15 bg-emerald-400/10 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                      <ShieldCheck className="h-4 w-4" />
                      Sharper inputs create sharper results
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">
                      Paste the full job description whenever possible so the analyzer can compare vocabulary, scope, and expected outcomes more accurately.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal delayMs={90}>
          <section className="rounded-[34px] border border-slate-200 bg-white p-4 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.22)] md:p-6">
            <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr] xl:items-start">
              <div className="space-y-4 rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.18)] md:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Resume source</p>
                    <div className="mt-2 flex items-center gap-2">
                      {hasActiveResume ? (
                        <div className="flex min-w-0 items-center gap-2 text-slate-900 font-medium">
                          <div className="rounded-md bg-blue-50 p-1.5">
                            <FileText className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="truncate max-w-[220px] sm:max-w-[440px]">
                            {usingUploadedResume
                              ? uploadedResume?.resumeData?.personalInfo?.fullName || uploadedResume?.label || "Uploaded Resume"
                              : resumeData.personalInfo.fullName || "In-app Resume"}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm font-bold uppercase tracking-tight text-slate-500">No resume selected</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={openResumePicker}
                      disabled={resumeUploading}
                      className={`inline-flex items-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                        hasActiveResume
                          ? "border border-slate-200 bg-white px-4 text-blue-600 shadow-sm hover:border-slate-300 hover:text-blue-700"
                          : "bg-blue-600 px-4 text-white shadow-md hover:bg-blue-700"
                      } disabled:opacity-50`}
                    >
                      {resumeUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Parsing...
                        </>
                      ) : hasActiveResume ? (
                        "Change resume"
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
                        className="text-xs font-semibold text-slate-500 transition-colors hover:text-slate-700"
                      >
                        Use app draft
                      </button>
                    )}
                  </div>
                </div>

                {resumeUploadError && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
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

                <div>
                  <label htmlFor="job-description" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Job description
                  </label>
                  <textarea
                    id="job-description"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={9}
                    placeholder="Paste the full job description here. More detail gives the analyzer better context, vocabulary coverage, and stronger recommendations."
                    className="crp-textarea resize-none"
                  />
                </div>
              </div>

              <aside className="rounded-[30px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_30px_80px_-44px_rgba(15,23,42,0.62)] md:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">Run analysis</p>
                <h2 className="mt-3 text-2xl font-black tracking-tight">Generate the role-fit briefing.</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  This briefing highlights the strongest signals, the biggest gaps, and the clearest path to improve alignment with the target role.
                </p>

                <div className="mt-6 space-y-3">
                  <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Description length</p>
                    <p className="mt-2 text-lg font-semibold text-white">{jobDescription.length} characters</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void generateAiSampleJD()}
                    disabled={generatingSampleJD}
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {generatingSampleJD ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating sample job description...
                        </>
                      ) : (
                        <>
                          <BrainCircuit className="h-4 w-4" />
                          Insert sample job description
                        </>
                      )}
                  </button>

                  <button
                    onClick={analyze}
                    disabled={analyzing || resumeUploading || !jobDescription.trim() || !hasActiveResume}
                    className="crp-btn-primary min-h-[48px] w-full px-6 py-3 text-sm disabled:opacity-40"
                  >
                    {analyzing ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Start analysis
                      </span>
                    )}
                  </button>
                </div>

                <div className="mt-6 rounded-[22px] border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Report includes</p>
                  <div className="mt-3 space-y-3">
                    {[
                      "A concise role-fit summary",
                      "Prioritized gaps by importance",
                      "Learning resources and an actionable next-step plan",
                    ].map((item, index) => (
                      <div key={item} className="flex items-start gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                          0{index + 1}
                        </div>
                        <p className="text-sm leading-relaxed text-slate-300">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </section>
        </ScrollReveal>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {result && (
          <section className="space-y-7">
            <ScrollReveal delayMs={130}>
              <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr] xl:items-start">
                <div className="rounded-[30px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_30px_80px_-44px_rgba(15,23,42,0.62)] md:p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">Executive summary</p>
                  <div className="mt-4 flex items-end gap-4">
                    <div>
                      <p className="text-5xl font-black tracking-tight text-white">
                        {result.overallScore ?? result.matchScore ?? result.atsScore}
                      </p>
                      <p className="mt-1 text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">Overall signal</p>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300">
                      Match score {result.matchScore}
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-relaxed text-slate-300 md:text-base">{result.analysisSummary || result.matchSummary}</p>

                  {result.recommendations?.length > 0 && (
                    <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">Immediate moves</p>
                      <ul className="mt-3 space-y-2.5">
                        {result.recommendations.slice(0, 5).map((rec) => (
                          <li key={rec} className="flex items-start gap-2 text-sm text-slate-200">
                            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                  {[
                    { label: "ATS score", value: result.atsScore },
                    { label: "Keyword score", value: result.keywordScore },
                    { label: "Section score", value: result.sectionScore },
                    { label: "Experience score", value: result.experienceScore },
                    { label: "Quality score", value: result.qualityScore },
                    { label: "Job match", value: result.jobMatchScore ?? result.matchScore },
                  ].map((metric, index) => (
                    <article
                      key={metric.label}
                      className="score-metric-card rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_24px_60px_-46px_rgba(15,23,42,0.2)]"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{metric.label}</p>
                      <p className="mt-3 text-4xl font-black tracking-tight text-slate-900">{metric.value}</p>
                    </article>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delayMs={185}>
              <div className="grid gap-5 xl:grid-cols-[0.82fr_1.18fr] xl:items-start">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-46px_rgba(15,23,42,0.22)] md:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Keyword coverage</p>
                  <div className="mt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600">Matched keywords</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {result.matchedKeywords?.length ? (
                        result.matchedKeywords.slice(0, 12).map((keyword) => (
                          <span key={keyword} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {keyword}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No matched keywords surfaced.</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-600">Missing keywords</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {result.missingKeywords?.length ? (
                        result.missingKeywords.slice(0, 12).map((keyword) => (
                          <span key={keyword} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                            {keyword}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No missing keywords surfaced.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-46px_rgba(15,23,42,0.22)] md:p-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Issues and risk notes</p>
                      <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">What is lowering fit right now</h3>
                    </div>
                    <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {result.issues?.length ?? 0} issues surfaced
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {result.issues?.length ? (
                      result.issues.map((issue) => (
                        <div key={issue} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                          {issue}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        No explicit issues were returned for this resume and job description pair.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <div className="space-y-4">
              <ScrollReveal delayMs={225}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Gap breakdown</p>
                    <h3 className="text-3xl font-black tracking-tight text-slate-900">The capability gaps worth closing next</h3>
                  </div>
                  <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {result.gaps?.length ?? 0} gaps detected
                  </div>
                </div>
              </ScrollReveal>

              {result.gaps?.length ? (
                result.gaps.map((gap, index) => {
                  const Icon = categoryIcon[gap.category] ?? BadgeCheck;
                  const status = gapStatus[gap.id] ?? "unknown";
                  const resourcesOpen = expandedResources[gap.id] ?? false;
                  return (
                    <ScrollReveal key={gap.id} delayMs={250 + index * 45}>
                      <article className="rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_24px_60px_-46px_rgba(15,23,42,0.2)] md:p-6">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                                <Icon className="h-4 w-4" />
                              </div>
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{gap.category}</p>
                            </div>
                            <h4 className="mt-3 text-xl font-black tracking-tight text-slate-900">{gap.item}</h4>
                            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{gap.context}</p>
                          </div>
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${importanceColor[gap.importance] ?? importanceColor.low}`}>
                            {gap.importance}
                          </span>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-2">
                          <button type="button" onClick={() => setStatus(gap.id, "known")} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${status === "known" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Known</button>
                          <button type="button" onClick={() => setStatus(gap.id, "learning")} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${status === "learning" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Learning</button>
                          <button type="button" onClick={() => setStatus(gap.id, "unknown")} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${status === "unknown" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Unknown</button>
                        </div>

                        {gap.practicalPlan?.length ? (
                          <div className="mt-5 rounded-[24px] border border-indigo-100 bg-indigo-50/60 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">Practical weekly plan</p>
                            <ul className="mt-3 space-y-2">
                              {gap.practicalPlan.map((step) => (
                                <li key={`${gap.id}-${step}`} className="flex items-start gap-2 text-sm text-slate-700">
                                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {gap.learningResources?.length > 0 && (
                          <div className="mt-5 border-t border-slate-100 pt-5">
                            <button
                              type="button"
                              onClick={() => toggleResources(gap.id)}
                              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                            >
                              Learning resources ({gap.learningResources.length})
                              {resourcesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>

                            {resourcesOpen && (
                              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {gap.learningResources.map((resource) => {
                                  const ResourceIcon = resourceIcon[resource.type] ?? FileText;
                                  return (
                                    <a
                                      key={`${gap.id}-${resource.title}`}
                                      href={platformUrl(resource)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-indigo-200 hover:bg-indigo-50"
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
                    </ScrollReveal>
                  );
                })
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  No explicit gaps were returned for this resume and job description pair.
                </div>
              )}
            </div>

            <ScrollReveal delayMs={310}>
              <div className="rounded-[28px] border border-indigo-100 bg-[linear-gradient(180deg,#eef2ff_0%,#f5f7ff_100%)] p-6 shadow-[0_20px_50px_-42px_rgba(15,23,42,0.2)] md:p-7">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600">Next move</p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Take the strongest recommendations into the builder.</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                      Use Resume Builder to apply the missing keywords, stronger proof points, and tighter positioning that this role needs.
                    </p>
                  </div>

                  <Link href="/create" className="crp-btn-secondary inline-flex min-h-[48px] items-center justify-center gap-2 px-6 py-3 text-sm text-indigo-700 hover:text-indigo-800">
                    Apply in Resume Builder
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </section>
        )}
      </div>
    </main>
  );
}

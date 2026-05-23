"use client";

import { useRef, useState } from "react";
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
import { useResumeStore } from "@/store/resumeStore";
import type { ResumeData } from "@/types/resume";
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

interface UploadedResume {
  label: string;
  resumeData: ResumeData;
}

const SAMPLE_JD = `We are hiring a Senior Frontend Engineer with strong React, TypeScript, and Next.js experience. Candidates should be comfortable building responsive UI systems, collaborating with product/design, improving performance, and writing maintainable component architecture. Experience with testing, accessibility, and API integration is preferred.`;

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

const quickStats = [
  { value: "PDF/DOCX", label: "Existing resume import" },
  { value: "ATS", label: "Scoring engine" },
  { value: "3", label: "Gap priority levels" },
  { value: "Links", label: "Learning resources" },
];

const workflowSteps = [
  {
    num: "01",
    label: "Bring your resume",
    desc: "Upload a PDF or DOCX resume, or keep using the resume you built in the app.",
    color: "from-blue-500 to-indigo-600",
  },
  {
    num: "02",
    label: "Paste the job",
    desc: "Drop in the full job description and let the analyzer extract the signals.",
    color: "from-sky-500 to-cyan-600",
  },
  {
    num: "03",
    label: "Act on the gaps",
    desc: "Review your match score, missing keywords, and the fastest learning path.",
    color: "from-emerald-500 to-teal-600",
  },
];

function hasResumeContent(data?: Partial<ResumeData> | null): boolean {
  if (!data) return false;

  const personalInfo = data.personalInfo;
  return Boolean(
    personalInfo?.fullName ||
      personalInfo?.email ||
      personalInfo?.phone ||
      personalInfo?.location ||
      personalInfo?.linkedin ||
      personalInfo?.website ||
      personalInfo?.jobTitle ||
      data.summary ||
      data.targetRole ||
      (data.skills?.length ?? 0) > 0 ||
      (data.workExperience?.length ?? 0) > 0 ||
      (data.education?.length ?? 0) > 0 ||
      (data.certifications?.length ?? 0) > 0
  );
}

// Component

export default function GapAnalysisPage() {
  const { resumeData } = useResumeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analysisWorkspaceRef = useRef<HTMLDivElement>(null);

  const [jobDescription, setJobDescription] = useState(resumeData.jobDescription || "");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<GapResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedResume, setUploadedResume] = useState<UploadedResume | null>(null);
  const [resumeUploadError, setResumeUploadError] = useState<string | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);

  // Per-gap user status: "unknown" | "known" | "learning"
  const [gapStatus, setGapStatus] = useState<Record<string, GapStatus>>({});
  // Which gaps have expanded resources visible
  const [expandedResources, setExpandedResources] = useState<Record<string, boolean>>({});

  const activeResumeData = uploadedResume?.resumeData ?? resumeData;
  const hasBuilderResume = hasResumeContent(resumeData);
  const hasActiveResume = hasResumeContent(activeResumeData);
  const usingUploadedResume = Boolean(uploadedResume);

  function scrollToAnalysisWorkspace() {
    analysisWorkspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openResumePicker() {
    fileInputRef.current?.click();
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
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function setStatus(id: string, status: GapStatus) {
    setGapStatus((prev) => ({ ...prev, [id]: status }));
    // Auto-expand resources when user says they don't know
    if (status === "learning") {
      setExpandedResources((prev) => ({ ...prev, [id]: true }));
    }
  }

  function toggleResources(id: string) {
    setExpandedResources((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const highGaps = result?.gaps.filter((g) => g.importance === "high") ?? [];
  const mediumGaps = result?.gaps.filter((g) => g.importance === "medium") ?? [];
  const lowGaps = result?.gaps.filter((g) => g.importance === "low") ?? [];
  const overallScore = result ? result.overallScore ?? result.atsScore ?? result.matchScore : 0;
  const atsCompatibilityScore = result ? result.atsCompatibilityScore ?? result.atsScore ?? result.matchScore : 0;
  const jobMatchScore = result ? result.jobMatchScore ?? result.keywordScore : 0;
  const recruiterAppealScore = result ? result.recruiterAppealScore ?? result.qualityScore : 0;
  const scoreCards = result
    ? [
        { label: "Overall Score", score: overallScore, color: "from-blue-500 to-indigo-500", note: "Deterministic blend" },
        { label: "ATS Compatibility", score: atsCompatibilityScore, color: "from-sky-500 to-cyan-500", note: "Structure + quality" },
        { label: "Job Match", score: jobMatchScore, color: "from-emerald-500 to-teal-500", note: "Skill alignment" },
        { label: "Recruiter Appeal", score: recruiterAppealScore, color: "from-amber-500 to-orange-500", note: "Impact + readability" },
      ]
    : [];
  const atsDetailCards = result
    ? [
        { label: "Keywords", score: result.keywordScore, color: "from-blue-500 to-indigo-500" },
        { label: "Sections", score: result.sectionScore, color: "from-sky-500 to-cyan-500" },
        { label: "Experience", score: result.experienceScore, color: "from-emerald-500 to-teal-500" },
        { label: "Quality", score: result.qualityScore, color: "from-amber-500 to-orange-500" },
      ]
    : [];
  const recommendations = result?.recommendations ?? [];
  const issues = result?.issues ?? [];
  const matchingSkills = result?.matchedKeywords ?? [];
  const missingSkills = result?.missingKeywords ?? [];
  const readinessEstimate = Math.min(100, overallScore + Math.max(0, highGaps.length * -6 + mediumGaps.length * -3) + 18);

  const knownCount = Object.values(gapStatus).filter((s) => s === "known").length;
  const learningCount = Object.values(gapStatus).filter((s) => s === "learning").length;

  return (
    <main className="min-h-screen crp-shell">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-sm font-bold text-white shadow-sm shadow-indigo-300/40">
              CR
            </div>
            <span className="text-sm font-bold tracking-wide text-slate-900 sm:text-base">Career Readiness Platform</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/" className="crp-nav-link">
              Home
            </Link>
            <Link href="/create" className="crp-nav-link">
              Resume Tailoring
            </Link>
            <Link href="/gap-analysis" className="crp-nav-link crp-nav-link-active">
              Gap Analysis
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-blue-100/60 blur-3xl" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-sky-100/60 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-6 pb-16 pt-20 text-center sm:pt-24">
          <span className="inline-flex items-center gap-2 bg-white border border-blue-100 text-blue-700 text-xs font-semibold px-4 py-1.5 rounded-full shadow-sm mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Career Intelligence
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.08] tracking-tight">
            Gap Analysis
          </h1>
          <p className="text-xl text-slate-500 mt-6 max-w-2xl mx-auto leading-relaxed">
            Compare your profile against a target role and discover what is missing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <button
              type="button"
              onClick={scrollToAnalysisWorkspace}
              disabled={resumeUploading}
              className="crp-btn-primary disabled:opacity-50 px-8 py-4 rounded-2xl text-lg font-semibold"
            >
              {resumeUploading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Parsing Resume...
                </span>
              ) : usingUploadedResume ? (
                <span className="inline-flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Replace Uploaded Resume
                  <ArrowRight className="h-4 w-4" />
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Upload Existing Resume
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
            <Link
              href="/create"
              className="crp-btn-secondary px-8 py-4 rounded-2xl text-lg"
            >
              Resume Tailoring
            </Link>
          </div>
          <p className="text-xs text-slate-400 mt-5">
            PDF and DOCX supported | no sign-up required | import your own resume or keep the in-app draft
          </p>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {quickStats.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-extrabold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">Simple process</p>
            <h2 className="text-4xl font-extrabold text-slate-900">Three moves, one clear outcome</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {workflowSteps.map((step) => (
              <div key={step.num} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-sm mb-4`}>
                  {step.num}
                </div>
                <h3 className="font-bold text-slate-800 mb-1.5">{step.label}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div ref={analysisWorkspaceRef} className="max-w-6xl mx-auto px-6 pb-20">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Analysis Workspace</p>
            <h2 className="text-3xl font-extrabold text-slate-900">Upload a resume, paste a job description, and inspect the gaps.</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl">
              Use an existing PDF or DOCX, or the resume you are already building in the app. The analyzer works the same either way.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
            <span className="rounded-full bg-white border border-slate-200 px-3 py-1 shadow-sm">PDF & DOCX</span>
            <span className="rounded-full bg-white border border-slate-200 px-3 py-1 shadow-sm">ATS score</span>
            <span className="rounded-full bg-white border border-slate-200 px-3 py-1 shadow-sm">Learning path</span>
          </div>
        </div>

        {/* Input panel */}
        <div className="app-panel crp-module-accent crp-soft-radial rounded-[2rem] p-6 sm:p-8 mb-6">
          {!hasBuilderResume && !usingUploadedResume && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center gap-2">
              [Warning] Your resume is empty. Upload an existing PDF or DOCX, or{" "}
              <Link href="/create" className="underline font-medium">
                build your resume first
              </Link>{" "}
              for the best results.
            </div>
          )}

          <div className="mb-4 rounded-xl border border-slate-200 bg-white/80 p-4 crp-glass">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resume Source</p>
                <p className="mt-1 text-sm text-slate-700">
                  {usingUploadedResume
                    ? `Using uploaded resume: ${uploadedResume?.label}`
                    : hasBuilderResume
                    ? "Using the resume you created in the app. Upload a PDF or DOCX to analyze an existing resume instead."
                    : "Upload your existing PDF or DOCX resume to analyze it directly."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={openResumePicker}
                  disabled={resumeUploading}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {resumeUploading ? "Parsing resume..." : usingUploadedResume ? "Replace resume" : "Upload existing resume"}
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
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400"
                  >
                    Use app resume
                  </button>
                )}
              </div>
            </div>

            {resumeUploadError && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {resumeUploadError}
              </p>
            )}

            {resumeUploading && <p className="mt-3 text-sm text-slate-500">Extracting and parsing your resume...</p>}

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
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              Job Description
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={8}
              placeholder="Paste the full job description here - the more detail, the better the analysis."
              className="crp-textarea resize-none"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400">{jobDescription.length} characters</p>
              <button
                type="button"
                onClick={() => setJobDescription(SAMPLE_JD)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Use Sample JD
              </button>
            </div>
          </div>

          <button
            onClick={analyze}
            disabled={analyzing || resumeUploading || !jobDescription.trim() || !hasActiveResume}
            className="crp-btn-primary flex items-center gap-2 disabled:opacity-40 px-6 py-2.5 text-sm"
          >
            {analyzing ? (
              <>
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing Gaps...
                </span>
              </>
            ) : resumeUploading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Parsing Resume...
              </span>
            ) : usingUploadedResume ? (
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Analyze Uploaded Resume
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Analyze Gaps
              </span>
            )}
          </button>

          {!hasActiveResume && (
            <p className="mt-3 text-xs text-slate-500">
              Add a resume from the app or upload an existing PDF/DOCX before running the analysis.
            </p>
          )}
        </div>

        {analyzing && (
            <div className="crp-card-soft crp-glass crp-module-accent p-5 mb-6">
            <p className="text-sm font-semibold text-slate-800 mb-3">Analysis in progress</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2.5">
              {[
                "Parsing Resume",
                "Analyzing Job Description",
                "Comparing Skills",
                "Generating Recommendations",
                "Preparing Learning Roadmap",
              ].map((step, idx) => (
                <div key={step} className="crp-progress-step flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${idx <= 2 ? "bg-indigo-500 animate-pulse" : "bg-slate-300"}`} />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {!result && !analyzing && !error && (
          <div className="crp-card-soft p-8 mb-6 text-center">
            <div className="mb-3 flex justify-center text-blue-600">
              <BrainCircuit className="h-9 w-9" />
            </div>
            <p className="text-lg font-semibold text-slate-800">No analysis available yet.</p>
            <p className="text-sm text-slate-500 mt-1">
              Upload your resume and provide a job description to get started.
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
              <div className="crp-card crp-score-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Overall Match Score</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-1">{overallScore}%</p>
              </div>
              <div className="crp-card crp-score-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Matching Skills</p>
                <p className="text-sm text-slate-700 mt-1.5">{matchingSkills.slice(0, 5).join(" | ") || "No strong matches detected yet."}</p>
              </div>
              <div className="crp-card crp-score-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Missing Skills</p>
                <p className="text-sm text-slate-700 mt-1.5">{missingSkills.slice(0, 5).join(" | ") || "No major keyword gaps detected."}</p>
              </div>
              <div className="crp-card crp-score-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Priority Areas</p>
                <p className="text-sm text-slate-700 mt-1.5">High: {highGaps.length} | Medium: {mediumGaps.length} | Low: {lowGaps.length}</p>
              </div>
              <div className="crp-card crp-score-card p-4 md:col-span-2 xl:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Career Readiness Assessment</p>
                <p className="text-sm text-slate-700 mt-1.5">
                  Current readiness: <span className="font-semibold">{overallScore}%</span>. Estimated readiness after implementing priority actions: <span className="font-semibold">{readinessEstimate}%</span>.
                </p>
              </div>
            </div>

            {/* Score bar */}
            <div className="app-panel crp-module-accent crp-soft-radial rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Overall Intelligence Score</p>
                  <p className="text-xs text-slate-500 mt-0.5">{result.analysisSummary || result.matchSummary}</p>
                </div>
                <span
                  className={`text-3xl font-bold ${
                    overallScore >= 70
                      ? "text-green-600"
                      : overallScore >= 50
                      ? "text-amber-600"
                      : "text-red-600"
                  }`}
                >
                  {overallScore}%
                </span>
              </div>
              <div className="crp-score-meter h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    overallScore >= 70
                      ? "bg-green-500"
                      : overallScore >= 50
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${overallScore}%` }}
                />
              </div>

              {scoreCards.length > 0 && (
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  {scoreCards.map((card) => (
                    <div key={card.label} className="crp-score-card p-3">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{card.note}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${card.color} text-white`}>
                          {card.score}%
                        </span>
                      </div>
                      <div className="crp-score-meter h-2">
                        <div className={`h-2 rounded-full bg-gradient-to-r ${card.color}`} style={{ width: `${card.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {atsDetailCards.length > 0 && (
                <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {atsDetailCards.map((card) => (
                    <div key={card.label} className="crp-score-card p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${card.color} text-white`}>
                          {card.score}%
                        </span>
                      </div>
                      <div className="crp-score-meter h-2">
                        <div className={`h-2 rounded-full bg-gradient-to-r ${card.color}`} style={{ width: `${card.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(recommendations.length > 0 || issues.length > 0) && (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {recommendations.length > 0 && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <p className="text-sm font-semibold text-blue-800 mb-2">Recommendations</p>
                      <ul className="space-y-2 text-xs text-slate-700">
                        {recommendations.slice(0, 6).map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="text-blue-500 mt-0.5">-</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {issues.length > 0 && (
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-sm font-semibold text-slate-800 mb-2">Issues Detected</p>
                      <ul className="space-y-2 text-xs text-slate-600">
                        {issues.slice(0, 6).map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="text-amber-500 mt-0.5">-</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Progress summary */}
              {result.gaps.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                    {result.gaps.length} gaps found
                  </span>
                  {knownCount > 0 && (
                    <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                      <span className="inline-flex items-center gap-1.5">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        {knownCount} you already know
                      </span>
                    </span>
                  )}
                  {learningCount > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                      <span className="inline-flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5" />
                        {learningCount} to learn
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* No gaps found */}
            {result.gaps.length === 0 && (
              <div className="app-panel rounded-2xl p-8 text-center">
                <div className="mb-3 flex justify-center text-emerald-600">
                  <Sparkles className="h-8 w-8" />
                </div>
                <p className="text-lg font-semibold text-slate-800">Excellent match!</p>
                <p className="text-sm text-slate-500 mt-1">
                  Your resume covers all the key requirements in this job description.
                </p>
              </div>
            )}

            {/* Gap groups */}
            {[
              { label: "High Priority Gaps", gaps: highGaps, color: "text-red-700", dotColor: "bg-red-500" },
              { label: "Medium Priority Gaps", gaps: mediumGaps, color: "text-amber-700", dotColor: "bg-amber-500" },
              { label: "Low Priority / Nice to Have", gaps: lowGaps, color: "text-slate-600", dotColor: "bg-slate-400" },
            ].map(
              ({ label, gaps, color, dotColor }) =>
                gaps.length > 0 && (
                  <div key={label} className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                      <h2 className={`text-sm font-bold uppercase tracking-wide ${color}`}>{label}</h2>
                      <span className="text-xs text-slate-400 ml-1">({gaps.length})</span>
                    </div>

                    <div className="space-y-4">
                      {gaps.map((gap) => {
                        const status = gapStatus[gap.id] || "unknown";
                        return (
                          <GapCard
                            key={gap.id}
                            gap={gap}
                            status={status}
                            resourcesExpanded={!!expandedResources[gap.id]}
                            onSetStatus={(s) => setStatus(gap.id, s)}
                            onToggleResources={() => toggleResources(gap.id)}
                          />
                        );
                      })}
                    </div>
                  </div>
                )
            )}

            {/* CTA */}
          {knownCount > 0 && (
            <div className="app-panel rounded-2xl p-5 border border-green-100 bg-green-50/80">
              <p className="text-sm font-semibold text-green-800 mb-1">
                <span className="inline-flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4" />
                  Ready to update your resume?
                </span>
              </p>
              <p className="text-xs text-green-700 mb-3">
                You marked {knownCount} gap{knownCount > 1 ? "s" : ""} as skills you already have. Add them to your resume to improve your match score.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/create?step=skills"
                  className="inline-flex items-center gap-1.5 bg-green-700 hover:bg-green-800 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  Add to Skills
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/create?step=experience"
                  className="inline-flex items-center gap-1.5 border border-green-700 text-green-800 hover:bg-green-100 text-sm px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Briefcase className="h-4 w-4" />
                  Add to Experience
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
          </>
        )}

        <section id="roadmap" className="mt-10">
          <div className="crp-card-soft p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-bold text-slate-900">Coming Soon</h2>
              <span className="crp-badge">Roadmap</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                { title: "Mock Interviews", desc: "Practice role-specific interviews generated from your resume and target JD." },
                { title: "Interview Question Generator", desc: "Generate likely interview questions from job descriptions and required skills." },
                { title: "AI Interview Feedback", desc: "Receive detailed feedback on communication, confidence, and technical depth." },
                { title: "Personalized Study Plans", desc: "Get role-aligned learning plans mapped to your priority skill gaps." },
              ].map((item) => (
                <article key={item.title} className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

// Gap Card

function GapCard({
  gap,
  status,
  resourcesExpanded,
  onSetStatus,
  onToggleResources,
}: {
  gap: Gap;
  status: GapStatus;
  resourcesExpanded: boolean;
  onSetStatus: (s: GapStatus) => void;
  onToggleResources: () => void;
}) {
  return (
    <div
      className={`app-panel rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        status === "known"
          ? "border-green-200 bg-green-50/80"
          : status === "learning"
          ? "border-blue-200 bg-blue-50/80"
          : "border-slate-100"
      }`}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
          {(categoryIcon[gap.category] || FileText)({ className: "h-3.5 w-3.5" })}
          {gap.category}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <span className="font-semibold text-slate-800">{gap.item}</span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wide ${
                importanceColor[gap.importance]
              }`}
            >
              {gap.importance}
            </span>
            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {gap.category}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">{gap.context}</p>
        </div>
      </div>

      {/* Status question */}
      {status === "unknown" && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-600 mb-2">Do you have experience with this?</p>
          <div className="flex gap-2">
            <button
              onClick={() => onSetStatus("known")}
              className="flex-1 text-xs font-medium py-1.5 rounded-lg border border-green-300 text-green-700 hover:bg-green-50 transition-colors"
            >
              Yes, I know this
            </button>
            <button
              onClick={() => onSetStatus("learning")}
              className="flex-1 text-xs font-medium py-1.5 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 transition-colors"
            >
              No, show me how to learn
            </button>
          </div>
        </div>
      )}

      {/* Known - prompt to add to resume */}
      {status === "known" && (
        <div className="mt-3 pt-3 border-t border-green-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-4 w-4 text-green-600" />
            <p className="text-xs text-green-700 font-medium">Great! Add it to your resume to boost your score.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
                  href="/create?step=skills"
                  className="text-xs font-semibold text-green-800 underline hover:text-green-900"
                >
                  Update Resume {"->"}
                </Link>
            <button
              onClick={() => onSetStatus("unknown")}
              className="text-[10px] text-slate-400 hover:text-slate-600"
            >
              undo
            </button>
          </div>
        </div>
      )}

      {/* Learning mode */}
      {status === "learning" && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-blue-600" />
              <p className="text-xs text-blue-700 font-medium">Here are resources to help you learn:</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleResources}
                className="text-[10px] text-blue-500 hover:text-blue-700 font-medium"
              >
                <span className="inline-flex items-center gap-1">
                  {resourcesExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {resourcesExpanded ? "Collapse" : "Expand"}
                </span>
              </button>
              <button
                onClick={() => onSetStatus("unknown")}
                className="text-[10px] text-slate-400 hover:text-slate-600"
              >
                undo
              </button>
            </div>
          </div>

          {resourcesExpanded && (
            <div className="space-y-2">
              {gap.learningResources.map((r, i) => (
                <a
                  key={i}
                  href={platformUrl(r)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 bg-white border border-blue-100 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all group"
                >
                  {(() => {
                    const ResourceIcon = resourceIcon[r.type] || FileText;
                    return <ResourceIcon className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-blue-500" />;
                  })()}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 group-hover:text-blue-700 truncate">
                      {r.title}
                    </p>
                    <p className="text-[10px] text-slate-400">{r.platform}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-400" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


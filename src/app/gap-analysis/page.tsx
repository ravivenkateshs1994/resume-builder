"use client";

import { useRef, useState } from "react";
import { parseResumeFile } from "@/lib/resumeFileParser";
import { useResumeStore } from "@/store/resumeStore";
import type { ResumeData } from "@/types/resume";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────────

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

// ── Helpers ────────────────────────────────────────────────────────────────────

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

const resourceIcon: Record<string, string> = {
  course: "🎓",
  video: "▶️",
  docs: "📖",
  book: "📚",
  practice: "💻",
};

const importanceColor: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};

const categoryIcon: Record<string, string> = {
  "Technical Skill": "⚙️",
  "Soft Skill": "🤝",
  "Tool/Platform": "🛠️",
  Certification: "🏆",
  "Domain Knowledge": "🧠",
  Experience: "💼",
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
    color: "from-violet-500 to-indigo-600",
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

// ── Component ──────────────────────────────────────────────────────────────────

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
  const scoreCards = result
    ? [
        { label: "Keywords", score: result.keywordScore, color: "from-violet-500 to-indigo-500" },
        { label: "Sections", score: result.sectionScore, color: "from-sky-500 to-cyan-500" },
        { label: "Experience", score: result.experienceScore, color: "from-emerald-500 to-teal-500" },
        { label: "Quality", score: result.qualityScore, color: "from-amber-500 to-orange-500" },
      ]
    : [];
  const recommendations = result?.recommendations ?? [];
  const issues = result?.issues ?? [];

  const knownCount = Object.values(gapStatus).filter((s) => s === "known").length;
  const learningCount = Object.values(gapStatus).filter((s) => s === "learning").length;

  return (
    <main className="min-h-screen bg-[#f8f9fc]">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              R
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">ResumeAI</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-6 text-sm text-slate-600 font-medium">
            <Link href="/" className="hover:text-slate-900 transition-colors">
              Home
            </Link>
            <Link href="/create" className="hover:text-slate-900 transition-colors">
              Builder
            </Link>
          </nav>

          <Link
            href="/create"
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-md shadow-violet-200"
          >
            Open Builder
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-violet-100/60 blur-3xl" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-sky-100/60 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
          <span className="inline-flex items-center gap-2 bg-white border border-violet-100 text-violet-700 text-xs font-semibold px-4 py-1.5 rounded-full shadow-sm mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            ATS Gap Analyzer
          </span>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-[1.08] tracking-tight">
            See exactly what to fix before you apply
          </h1>
          <p className="text-xl text-slate-500 mt-6 max-w-2xl mx-auto leading-relaxed">
            Upload an existing resume or use the one you built in the app, paste a job description, and get a clear scorecard with learning resources for every gap.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <button
              type="button"
              onClick={scrollToAnalysisWorkspace}
              disabled={resumeUploading}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all shadow-xl shadow-violet-200"
            >
              {resumeUploading ? "Parsing Resume..." : usingUploadedResume ? "Replace Uploaded Resume →" : "Upload Existing Resume →"}
            </button>
            <Link
              href="/create"
              className="border-2 border-slate-200 bg-white hover:border-slate-300 text-slate-700 px-8 py-4 rounded-2xl text-lg font-semibold transition-colors"
            >
              Open Builder
            </Link>
          </div>
          <p className="text-xs text-slate-400 mt-5">
            PDF and DOCX supported · no sign-up required · import your own resume or keep the in-app draft
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
            <p className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-3">Simple process</p>
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
            <p className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-2">Analysis Workspace</p>
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
        <div className="app-panel rounded-[2rem] p-6 sm:p-8 mb-6">
          {!hasBuilderResume && !usingUploadedResume && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center gap-2">
              ⚠️ Your resume is empty. Upload an existing PDF or DOCX, or{" "}
              <Link href="/create" className="underline font-medium">
                build your resume first
              </Link>{" "}
              for the best results.
            </div>
          )}

          <div className="mb-4 rounded-xl border border-slate-200 bg-white/80 p-4">
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
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
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
              placeholder="Paste the full job description here — the more detail, the better the analysis."
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            />
            <p className="text-xs text-slate-400 mt-1">{jobDescription.length} characters</p>
          </div>

          <button
            onClick={analyze}
            disabled={analyzing || resumeUploading || !jobDescription.trim() || !hasActiveResume}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm"
          >
            {analyzing ? (
              <>
                <span className="animate-spin inline-block">⟳</span> Analyzing Gaps...
              </>
            ) : resumeUploading ? (
              <>⏳ Parsing Resume...</>
            ) : usingUploadedResume ? (
              <>🔍 Analyze Uploaded Resume</>
            ) : (
              <>🔍 Analyze Gaps</>
            )}
          </button>

          {!hasActiveResume && (
            <p className="mt-3 text-xs text-slate-500">
              Add a resume from the app or upload an existing PDF/DOCX before running the analysis.
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Score bar */}
            <div className="app-panel rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">ATS Match Score</p>
                  <p className="text-xs text-slate-500 mt-0.5">{result.analysisSummary || result.matchSummary}</p>
                </div>
                <span
                  className={`text-3xl font-bold ${
                    (result.atsScore ?? result.matchScore) >= 70
                      ? "text-green-600"
                      : (result.atsScore ?? result.matchScore) >= 50
                      ? "text-amber-600"
                      : "text-red-600"
                  }`}
                >
                  {result.atsScore ?? result.matchScore}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    (result.atsScore ?? result.matchScore) >= 70
                      ? "bg-green-500"
                      : (result.atsScore ?? result.matchScore) >= 50
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${result.atsScore ?? result.matchScore}%` }}
                />
              </div>

              {scoreCards.length > 0 && (
                <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {scoreCards.map((card) => (
                    <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${card.color} text-white`}>
                          {card.score}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className={`h-2 rounded-full bg-gradient-to-r ${card.color}`} style={{ width: `${card.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(recommendations.length > 0 || issues.length > 0) && (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {recommendations.length > 0 && (
                    <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                      <p className="text-sm font-semibold text-violet-800 mb-2">Recommendations</p>
                      <ul className="space-y-2 text-xs text-slate-700">
                        {recommendations.slice(0, 6).map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="text-violet-500 mt-0.5">•</span>
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
                            <span className="text-amber-500 mt-0.5">•</span>
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
                      ✓ {knownCount} you already know
                    </span>
                  )}
                  {learningCount > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                      📚 {learningCount} to learn
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* No gaps found */}
            {result.gaps.length === 0 && (
              <div className="app-panel rounded-2xl p-8 text-center">
                <div className="text-4xl mb-3">🎉</div>
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
                ✅ Ready to update your resume?
              </p>
              <p className="text-xs text-green-700 mb-3">
                You marked {knownCount} gap{knownCount > 1 ? "s" : ""} as skills you already have. Add them to your resume to improve your match score.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/create?step=skills"
                  className="inline-flex items-center gap-1.5 bg-green-700 hover:bg-green-800 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  ✨ Add to Skills →
                </Link>
                <Link
                  href="/create?step=experience"
                  className="inline-flex items-center gap-1.5 border border-green-700 text-green-800 hover:bg-green-100 text-sm px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  💼 Add to Experience →
                </Link>
              </div>
            </div>
          )}
          </>
        )}
      </div>
    </main>
  );
}

// ── Gap Card ───────────────────────────────────────────────────────────────────

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
        <span className="text-xl mt-0.5">{categoryIcon[gap.category] || "📌"}</span>
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
              ✓ Yes, I know this
            </button>
            <button
              onClick={() => onSetStatus("learning")}
              className="flex-1 text-xs font-medium py-1.5 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 transition-colors"
            >
              📚 No, show me how to learn
            </button>
          </div>
        </div>
      )}

      {/* Known — prompt to add to resume */}
      {status === "known" && (
        <div className="mt-3 pt-3 border-t border-green-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-sm">✓</span>
            <p className="text-xs text-green-700 font-medium">Great! Add it to your resume to boost your score.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
                  href="/create?step=skills"
                  className="text-xs font-semibold text-green-800 underline hover:text-green-900"
                >
                  Update Resume →
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
              <span className="text-blue-600 text-sm">📚</span>
              <p className="text-xs text-blue-700 font-medium">Here are resources to help you learn:</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleResources}
                className="text-[10px] text-blue-500 hover:text-blue-700 font-medium"
              >
                {resourcesExpanded ? "Collapse ▲" : "Expand ▼"}
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
                  <span className="text-base">{resourceIcon[r.type] || "🔗"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 group-hover:text-blue-700 truncate">
                      {r.title}
                    </p>
                    <p className="text-[10px] text-slate-400">{r.platform}</p>
                  </div>
                  <span className="text-xs text-slate-300 group-hover:text-blue-400">↗</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

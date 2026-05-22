"use client";

import { useState } from "react";
import { useResumeStore } from "@/store/resumeStore";
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
  matchScore: number;
  matchSummary: string;
  gaps: Gap[];
}

type GapStatus = "unknown" | "known" | "learning";

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

// ── Component ──────────────────────────────────────────────────────────────────

export default function GapAnalysisPage() {
  const { resumeData } = useResumeStore();

  const [jobDescription, setJobDescription] = useState(resumeData.jobDescription || "");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<GapResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Per-gap user status: "unknown" | "known" | "learning"
  const [gapStatus, setGapStatus] = useState<Record<string, GapStatus>>({});
  // Which gaps have expanded resources visible
  const [expandedResources, setExpandedResources] = useState<Record<string, boolean>>({});

  async function analyze() {
    if (!jobDescription.trim()) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);
    setGapStatus({});
    setExpandedResources({});

    try {
      const res = await fetch("/api/gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData, jobDescription }),
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

  const hasResume =
    resumeData.skills.length > 0 ||
    resumeData.workExperience.length > 0 ||
    resumeData.summary;

  const highGaps = result?.gaps.filter((g) => g.importance === "high") ?? [];
  const mediumGaps = result?.gaps.filter((g) => g.importance === "medium") ?? [];
  const lowGaps = result?.gaps.filter((g) => g.importance === "low") ?? [];

  const knownCount = Object.values(gapStatus).filter((s) => s === "known").length;
  const learningCount = Object.values(gapStatus).filter((s) => s === "learning").length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-indigo-50/20">
      {/* Navbar */}
      <nav className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto app-panel rounded-b-2xl border-t-0">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">R</div>
          <span className="font-bold text-slate-800 text-lg tracking-tight">ResumeAI</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/create"
            className="text-sm text-slate-600 hover:text-slate-900 font-medium"
          >
            Resume Builder
          </Link>
          <span className="text-xs font-semibold bg-violet-100 text-violet-700 px-3 py-1 rounded-full">
            Gap Analyzer
          </span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-10 pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Resume Gap Analyzer
          </h1>
          <p className="text-slate-500 mt-2">
            Compare your resume against a job description to find missing skills and get personalized learning recommendations.
          </p>
        </div>

        {/* Input panel */}
        <div className="app-panel rounded-2xl p-6 mb-6">
          {!hasResume && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center gap-2">
              ⚠️ Your resume is empty.{" "}
              <Link href="/create" className="underline font-medium">
                Build your resume first
              </Link>{" "}
              for the best results.
            </div>
          )}

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
            disabled={analyzing || !jobDescription.trim()}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm"
          >
            {analyzing ? (
              <>
                <span className="animate-spin inline-block">⟳</span> Analyzing Gaps...
              </>
            ) : (
              <>🔍 Analyze Gaps</>
            )}
          </button>
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
                  <p className="text-xs text-slate-500 mt-0.5">{result.matchSummary}</p>
                </div>
                <span
                  className={`text-3xl font-bold ${
                    result.matchScore >= 70
                      ? "text-green-600"
                      : result.matchScore >= 50
                      ? "text-amber-600"
                      : "text-red-600"
                  }`}
                >
                  {result.matchScore}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    result.matchScore >= 70
                      ? "bg-green-500"
                      : result.matchScore >= 50
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${result.matchScore}%` }}
                />
              </div>

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
            <div className="app-panel rounded-2xl p-5 border border-green-200 bg-green-50">
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
      className={`app-panel rounded-xl p-4 border transition-all ${
        status === "known"
          ? "border-green-300 bg-green-50/60"
          : status === "learning"
          ? "border-blue-300 bg-blue-50/60"
          : "border-slate-200"
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

"use client";

import Link from "next/link";
import { FileText, ArrowRight, BadgeCheck, GraduationCap, ChevronDown, ChevronUp, Briefcase, BookOpen, Code2, Trophy, Wrench, BrainCircuit, PlayCircle } from "lucide-react";
import { useResumeStore } from "@/store/resumeStore";

export default function GapAnalysisPage() {
  const { resumeData } = useResumeStore();
  const hasBuilderResume = Boolean(resumeData && Object.keys(resumeData).length > 0 && resumeData.personalInfo?.fullName !== "");
  const activeName = resumeData.personalInfo?.fullName || "your resume";

  return (
    <main className="min-h-screen crp-shell">
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
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.08] tracking-tight">Gap Analysis</h1>
          <p className="text-xl text-slate-500 mt-6 max-w-2xl mx-auto leading-relaxed">Compare your profile against a target role and discover what is missing.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link href="/gap-analysis/analysis" className="crp-btn-primary px-8 py-4 rounded-2xl text-lg font-semibold group transition-all hover:scale-[1.02]">
              <span className="inline-flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Start Analysis
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link href="/create" className="crp-btn-secondary px-8 py-4 rounded-2xl text-lg">Resume Tailoring</Link>
          </div>
          <p className="text-xs text-slate-400 mt-5">PDF and DOCX supported | no sign-up required | import your own resume or keep {hasBuilderResume ? "using " + activeName : "the in-app draft"}</p>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl font-extrabold text-slate-900">PDF/DOCX</p>
            <p className="text-sm text-slate-500 mt-0.5">Existing resume import</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-slate-900">ATS</p>
            <p className="text-sm text-slate-500 mt-0.5">Scoring engine</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-slate-900">3</p>
            <p className="text-sm text-slate-500 mt-0.5">Gap priority levels</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-slate-900">Links</p>
            <p className="text-sm text-slate-500 mt-0.5">Learning resources</p>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">Simple process</p>
            <h2 className="text-4xl font-extrabold text-slate-900">Three moves, one clear outcome</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm mb-4`}>01</div>
              <h3 className="font-bold text-slate-800 mb-1.5">Bring your resume</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Upload a PDF or DOCX resume, or keep using the resume you built in the app.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm mb-4`}>02</div>
              <h3 className="font-bold text-slate-800 mb-1.5">Paste the job</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Drop in the full job description and let the analyzer extract the signals.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm mb-4`}>03</div>
              <h3 className="font-bold text-slate-800 mb-1.5">Act on the gaps</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Review your match score, missing keywords, and the fastest learning path.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


// Gap Card
// Types used by GapCard
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

type GapStatus = "unknown" | "known" | "learning";

const importanceColor: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};

const categoryIcon: Record<string, any> = {
  "Technical Skill": Wrench,
  "Soft Skill": BrainCircuit,
  "Tool/Platform": Code2,
  Certification: Trophy,
  "Domain Knowledge": BookOpen,
  Experience: Briefcase,
};

const resourceIcon: Record<LearningResource["type"], any> = {
  course: GraduationCap,
  video: PlayCircle,
  docs: FileText,
  book: BookOpen,
  practice: Code2,
};

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
  const CategoryIcon = categoryIcon[gap.category] || FileText;
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
          <CategoryIcon className="h-3.5 w-3.5" />
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


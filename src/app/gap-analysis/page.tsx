"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  LineChart,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useResumeStore } from "@/store/resumeStore";

const analysisSignals = [
  "Role match scoring",
  "Missing skills detection",
  "Priority gap framing",
  "Learning path suggestions",
];

const premiumOutcomes = [
  {
    title: "Gap clarity",
    copy: "See where your current resume underperforms against the role before you spend time rewriting everything.",
    icon: Target,
    tone: "from-blue-500 to-indigo-600",
  },
  {
    title: "Recruiter signal",
    copy: "Surface the missing terms, weak proof points, and relevance gaps that hurt shortlist chances.",
    icon: LineChart,
    tone: "from-cyan-500 to-sky-600",
  },
  {
    title: "Action plan",
    copy: "Turn the analysis into concrete next steps across resume content, skills, and learning priorities.",
    icon: BookOpen,
    tone: "from-emerald-500 to-teal-600",
  },
];

const processSteps = [
  {
    id: "01",
    title: "Bring your current resume",
    copy: "Upload a PDF or DOCX, or continue with the draft already built inside the product.",
  },
  {
    id: "02",
    title: "Paste the target job description",
    copy: "The analyzer reads role expectations, vocabulary, and experience signals before comparing them to your profile.",
  },
  {
    id: "03",
    title: "Get a premium breakdown",
    copy: "Review match quality, missing capabilities, and the most efficient path to close the gap.",
  },
];

const storyFrames = [
  {
    eyebrow: "Signal quality",
    title: "Move beyond generic resume scoring.",
    copy: "This route is designed to answer a more useful question: what specifically is missing for this role, and what matters most right now?",
  },
  {
    eyebrow: "Decision support",
    title: "Use it before rewriting the resume blind.",
    copy: "Instead of editing everything, identify the gaps with the highest leverage, then refine only the sections that improve fit.",
  },
  {
    eyebrow: "Execution",
    title: "Turn analysis into a concrete improvement path.",
    copy: "The output is meant to guide next actions across resume content, skills, and the fastest learning moves to improve role alignment.",
  },
];

export default function GapAnalysisPage() {
  const { resumeData } = useResumeStore();
  const hasBuilderResume = Boolean(resumeData && Object.keys(resumeData).length > 0 && resumeData.personalInfo?.fullName !== "");
  const activeName = resumeData.personalInfo?.fullName || "your resume";

  return (
    <main className="crp-shell min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_26%,#f8fafc_100%)] text-sm md:text-base">
      <section className="relative overflow-hidden border-b border-slate-200/80">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-0 h-[420px] w-[420px] rounded-full bg-cyan-100/70 blur-3xl" />
          <div className="absolute right-[-8%] top-12 h-[520px] w-[520px] rounded-full bg-indigo-100/70 blur-3xl" />
          <div className="absolute left-[12%] top-[24%] h-24 w-24 rounded-full bg-emerald-100/60 blur-2xl motion-float" />
          <div className="absolute right-[18%] top-[18%] h-20 w-20 rounded-full bg-white/70 blur-2xl motion-float" style={{ animationDelay: "1.2s" }} />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,rgba(248,251,255,0)_0%,rgba(248,250,252,0.9)_100%)]" />
        </div>

        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-16 pt-12 sm:px-6 lg:pb-24 lg:pt-18">
          <ScrollReveal delayMs={40}>
            <section className="overflow-hidden rounded-[36px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_28%),linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] p-6 shadow-[0_28px_80px_-48px_rgba(15,23,42,0.32)] md:p-8 lg:p-10">
              <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
                <div>
                  <span className="crp-badge">Career Intelligence</span>
                  <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl lg:leading-[1.02]">
                    Premium gap analysis for the role you want next.
                  </h1>
                  <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
                    Compare your current profile against a target role, spot the missing signals quickly, and focus your next edits on the few changes most likely to improve fit.
                  </p>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link href="/gap-analysis/analysis" className="crp-btn-primary min-h-[50px] px-7 py-3 text-sm md:text-base">
                      <span className="inline-flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Start analysis
                        <ArrowRight className="h-5 w-5" />
                      </span>
                    </Link>
                    <Link href="/create" className="crp-btn-secondary min-h-[50px] px-7 py-3 text-sm md:text-base">
                      Refine resume in builder
                    </Link>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-2">
                    {analysisSignals.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-slate-200 bg-white/85 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <p className="mt-5 text-xs text-slate-400 md:text-sm">
                    PDF and DOCX supported. Start with your own file or continue from {hasBuilderResume ? activeName : "the in-app draft"}.
                  </p>
                </div>

                <div className="rounded-[30px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_34px_80px_-46px_rgba(15,23,42,0.68)] md:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">Analysis engine</p>
                      <h2 className="mt-2 text-2xl font-bold tracking-tight">What this review focuses on</h2>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-100">
                      <Sparkles className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Current source</p>
                      <p className="mt-2 text-lg font-semibold text-white">{hasBuilderResume ? activeName : "In-app draft or imported resume"}</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-300">
                        The engine compares your current profile structure, evidence, and skills against the target role.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {[
                        "Experience relevance and proof strength",
                        "Missing skills, tools, and domain keywords",
                        "ATS fit, recruiter readability, and learning direction",
                      ].map((item, index) => (
                        <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                            0{index + 1}
                          </div>
                          <p className="text-sm leading-relaxed text-slate-200">{item}</p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-[24px] border border-emerald-400/15 bg-emerald-400/10 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                        <ShieldCheck className="h-4 w-4" />
                        Focused, role-specific output
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-300">
                        You get a sharper analysis when you paste the full job description instead of a short summary.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        { label: "Role fit", value: "Intentional" },
                        { label: "Keyword depth", value: "Targeted" },
                        { label: "Actionability", value: "High" },
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
                  </div>
                </div>
              </div>
            </section>
          </ScrollReveal>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="grid gap-4 lg:grid-cols-3">
          {storyFrames.map((frame, index) => (
            <ScrollReveal key={frame.title} delayMs={70 + index * 70}>
              <article className="crp-story-card rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-7 shadow-[0_26px_60px_-46px_rgba(15,23,42,0.22)] md:p-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{frame.eyebrow}</p>
                <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900">{frame.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">{frame.copy}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:py-18">
        <ScrollReveal delayMs={90}>
          <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
              <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-46px_rgba(15,23,42,0.24)] md:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Premium outcomes</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">A role-fit briefing, not a checklist.</h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 md:text-base">
                Use this report to decide what to rewrite, what to learn, and which signals need stronger proof before tailoring your resume.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {premiumOutcomes.map((item, index) => {
                const Icon = item.icon;

                return (
                  <ScrollReveal key={item.title} delayMs={120 + index * 75}>
                    <article
                      className="score-metric-card rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_24px_60px_-46px_rgba(15,23,42,0.2)]"
                      style={{ animationDelay: `${index * 90}ms` }}
                    >
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.tone} text-white shadow-lg`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 text-lg font-bold tracking-tight text-slate-900">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.copy}</p>
                    </article>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </ScrollReveal>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:pb-24">
        <ScrollReveal delayMs={130}>
          <div className="rounded-[34px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_34px_90px_-54px_rgba(15,23,42,0.7)] md:p-8 lg:p-10">
            <div className="grid gap-8 xl:grid-cols-[0.78fr_1.22fr] xl:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Workflow</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Three deliberate steps from resume to role-fit clarity.</h2>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 md:text-base">
                  Bring in your current resume, compare it to the role, and leave with a clearer sense of what to fix, emphasize, or learn next.
                </p>

                <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />
                    <p className="text-sm leading-relaxed text-slate-200">
                      This route is best when you already know the role you want and need a sharper plan before tailoring the resume.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {processSteps.map((step, index) => (
                  <ScrollReveal key={step.id} delayMs={160 + index * 75}>
                    <article className="crp-story-card rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">Step {step.id}</div>
                      <h3 className="mt-3 text-xl font-bold tracking-tight text-white">{step.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-slate-300">{step.copy}</p>
                    </article>
                  </ScrollReveal>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row">
              <Link href="/gap-analysis/analysis" className="crp-btn-primary min-h-[48px] px-6 py-3 text-sm md:text-base">
                Start analysis
              </Link>
              <Link href="/create" className="crp-btn-secondary min-h-[48px] px-6 py-3 text-sm md:text-base">
                Return to resume builder
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}





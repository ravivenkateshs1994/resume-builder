"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { CountUpOnView } from "@/components/ui/CountUpOnView";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useScrollDepth } from "@/hooks/useScrollDepth";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileSearch,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

const coreTools = [
  {
    icon: FileSearch,
    title: "Resume Analyzer",
    category: "Analyze",
    description: "Detect weak bullets, missing impact metrics, and formatting risks before recruiters do.",
  },
  {
    icon: Target,
    title: "JD Match Engine",
    category: "Match",
    description: "Compare your resume against the exact job description and expose keyword and skill gaps.",
  },
  {
    icon: BarChart3,
    title: "Skill Gap Intelligence",
    category: "Improve",
    description: "Get a role-specific map of missing capabilities, prioritized by hiring impact.",
  },
  {
    icon: Route,
    title: "Learning Roadmap",
    category: "Grow",
    description: "Turn weak areas into a weekly plan with practical resources and measurable milestones.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Interview Readiness",
    category: "Practice",
    description: "Prepare using role-aware prompts and confidence-building recommendations.",
  },
  {
    icon: Target,
    title: "Career Score Dashboard",
    category: "Track",
    description: "Monitor readiness trends with one unified score and four sub-metrics you can improve fast.",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Import resume and target role",
    description:
      "Upload your current resume, add the job description, and pick your career goal in under two minutes.",
  },
  {
    step: "02",
    title: "Get your readiness diagnostics",
    description:
      "See keyword gaps, section quality, ATS compatibility, interview readiness, and role-fit confidence.",
  },
  {
    step: "03",
    title: "Execute a personalized action plan",
    description:
      "Apply guided improvements, track progress over time, and move from resume edits to interview calls faster.",
  },
];

const trustStats = [
  {
    value: 2.4,
    decimals: 1,
    suffix: "x",
    label: "faster resume-job alignment",
  },
  {
    value: 89,
    suffix: "%",
    label: "users improve ATS relevance in first session",
  },
  {
    value: 4,
    suffix: " signals",
    label: "tracked in one readiness score",
  },
  {
    value: 10,
    suffix: " min",
    label: "to get your first actionable plan",
  },
];

export default function LandingPage() {
  const { y } = useScrollDepth(8);
  const heroOffset = Math.min(y, 320);

  return (
    <div className="crp-shell min-h-screen text-slate-900">
      <SiteHeader />

      <section id="home" className="relative overflow-hidden px-6 pb-16 pt-14 md:pt-20">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div
            className="hero-orb absolute -left-16 top-8 h-64 w-64 rounded-full bg-cyan-200/35 blur-3xl"
            style={{ transform: `translate3d(${heroOffset * -0.06}px, ${heroOffset * 0.18}px, 0)` }}
          />
          <div
            className="hero-orb absolute right-0 top-10 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl"
            style={{ transform: `translate3d(${heroOffset * 0.04}px, ${heroOffset * 0.12}px, 0)` }}
          />
        </div>

        <div className="relative mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <ScrollReveal delayMs={80}>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/90 px-4 py-1.5 text-xs font-semibold text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              Career operating system for job seekers
            </span>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Turn every application into an interview-ready submission
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Career Readiness combines resume intelligence, role-match diagnostics, and a clear improvement roadmap so you know what to fix next and why.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/create" className="crp-btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 text-sm">
                Start your journey
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#how-it-works" className="crp-btn-secondary inline-flex items-center justify-center px-6 py-3 text-sm">
                See How It Works
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ATS-first recommendations
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Role-specific skill gap map
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Clear weekly improvement plan
              </span>
            </div>
          </ScrollReveal>

          <ScrollReveal
            delayMs={220}
            className="crp-card-soft motion-float relative overflow-hidden p-5 sm:p-6"
            style={{ transform: `translate3d(0, ${Math.max(-8, heroOffset * -0.03)}px, 0)` }}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Career Readiness Score</p>
                <p className="text-xs text-slate-500">Updated after each analysis</p>
              </div>
              <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                <div className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-700">
                  Live Preview
                </div>
                <div className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  +12 this month
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Resume Strength", value: 82, color: "#16A34A" },
                { label: "Skill Relevance", value: 74, color: "#0EA5E9" },
                { label: "Interview Readiness", value: 70, color: "#F59E0B" },
                { label: "Career Growth", value: 76, color: "#4F46E5" },
              ].map((metric, index) => (
                <div key={metric.label} className="score-metric-card rounded-xl border border-slate-200 bg-white p-3" style={{ animationDelay: `${80 + index * 90}ms` }}>
                  <p className="text-[11px] text-slate-500">{metric.label}</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{metric.value}/100</p>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                    <div
                      className="crp-meter-fill h-1.5 rounded-full"
                      style={{ "--progress": metric.value / 100, backgroundColor: metric.color } as CSSProperties}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3">
              <p className="text-xs font-semibold text-slate-800">Next action</p>
              <p className="mt-1 text-sm text-slate-600">Add five missing keywords from the role description to your Experience section.</p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-14">
        <div className="crp-card-soft grid gap-4 p-5 md:grid-cols-4 md:gap-5 md:p-6">
          {trustStats.map((item, index) => (
            <ScrollReveal key={item.label} delayMs={80 + index * 90}>
              <p className="text-2xl font-extrabold text-slate-900 md:text-3xl">
                <CountUpOnView
                  end={item.value}
                  decimals={item.decimals ?? 0}
                  suffix={item.suffix ?? ""}
                  durationMs={1100 + index * 120}
                />
              </p>
              <p className="mt-1 text-sm text-slate-600">{item.label}</p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto w-full max-w-7xl px-6 pb-16">
        <ScrollReveal className="mb-8 max-w-3xl" delayMs={40}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">How It Works</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            A simple system for consistent job-search momentum
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            Instead of rewriting your resume blindly, you move through a guided cycle: diagnose, prioritize, improve, and track.
          </p>
        </ScrollReveal>

        <div className="grid gap-4 md:grid-cols-3">
          {howItWorks.map((step, index) => (
            <ScrollReveal key={step.step} as="article" className="crp-card-soft p-5 md:p-6" delayMs={80 + index * 100}>
              <div className="inline-flex rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700">
                {step.step}
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section id="core-tools" className="mx-auto w-full max-w-7xl px-6 pb-16">
        <ScrollReveal className="mb-8 max-w-3xl" delayMs={40}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">Core Platform</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Everything you need to move from application anxiety to interview confidence
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {coreTools.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <ScrollReveal
                key={feature.title}
                as="article"
                delayMs={70 + index * 60}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)] transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-[0_24px_55px_-30px_rgba(79,70,229,0.35)]"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                    {feature.category}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      <section id="personas" className="mx-auto w-full max-w-7xl px-6 pb-16">
        <ScrollReveal className="mb-8 max-w-3xl" delayMs={40}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Personalized Paths</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Built for both early-career and experienced professionals
          </h2>
        </ScrollReveal>

        <div className="grid gap-5 md:grid-cols-2">
          <ScrollReveal as="article" className="crp-card-soft p-6" delayMs={90}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">
              <Route className="h-3.5 w-3.5" />
              Fresher Track
            </div>
            <h3 className="text-xl font-bold text-slate-900">Build your first strong professional narrative</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Convert projects, internships, and coursework into compelling impact statements that pass ATS scans and recruiter skims.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />Entry-level role alignment checklist</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />Skill priorities by role family</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />Interview starter preparation plan</li>
            </ul>
          </ScrollReveal>

          <ScrollReveal as="article" className="crp-card-soft p-6" delayMs={170}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800">
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              Experienced Track
            </div>
            <h3 className="text-xl font-bold text-slate-900">Position yourself for better roles and bigger responsibilities</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Highlight strategic outcomes, leadership signals, and domain depth while closing role-specific gaps for your next move.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />Leadership and ownership framing cues</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />Promotion and switch readiness indicators</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />Targeted interview deep-dive prep</li>
            </ul>
          </ScrollReveal>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-24">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-900 to-cyan-900 p-7 text-white sm:p-9">
          <div className="grid gap-7 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Build a stronger application loop
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Stop applying with guesswork. Start applying with a strategy.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cyan-100 sm:text-base">
                In one workspace, analyze your resume, prioritize the highest-impact improvements, and track readiness over time.
              </p>
            </div>

            <div className="space-y-3">
              <Link href="/create" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
                Start your journey
                <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-xs font-medium text-cyan-100">
                <Clock3 className="h-4 w-4" />
                First actionable report in about 10 minutes
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

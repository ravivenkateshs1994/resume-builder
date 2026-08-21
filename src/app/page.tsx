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
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  Clock3,
  Layers3,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wand2,
} from "lucide-react";

const proofMetrics = [
  {
    value: 4,
    suffix: "",
    label: "Signals Visible in One Score",
  },
  {
    value: 10,
    suffix: " min",
    label: "To a First Actionable Plan",
  },
  {
    value: 1,
    suffix: "",
    label: "Job Link to Begin",
  },
  {
    value: 3,
    suffix: "",
    label: "Clear Next Steps After Each Scan",
  },
];

const differentiators = [
  {
    title: "It shows the change, not just the score",
    description:
      "Use a live before-and-after view so people can instantly understand why a line should change and what the rewrite improves.",
  },
  {
    title: "It feels like a strategy console",
    description:
      "The interface is built around a job-to-interview workflow, with visible states that guide the user to the next action.",
  },
  {
    title: "It makes the product legible at a glance",
    description:
      "Color, motion, and hierarchy work together so the homepage feels more like an active product than a marketing page.",
  },
];

const audiencePanels = [
  {
    badge: "Students and Freshers",
    title: "Turn coursework and projects into strong professional proof.",
    description:
      "Translate internships, labs, and self-led work into impact statements that feel recruiter-ready.",
    points: [
      "Entry-level role matching",
      "Skill priorities by target role",
      "Interview starter prompts",
    ],
  },
  {
    badge: "Experienced Professionals",
    title: "Reframe your experience for stronger roles and better scope.",
    description:
      "Surface leadership, ownership, and outcome language while closing the gaps that matter for the next jump.",
    points: [
      "Promotion and switch readiness",
      "Leadership framing cues",
      "Targeted interview deep-dives",
    ],
  },
];

const previewStats = [
  { label: "Resume strength", value: 82, color: "#22c55e" },
  { label: "Role fit", value: 74, color: "#0ea5e9" },
  { label: "Interview readiness", value: 70, color: "#f59e0b" },
];

export default function LandingPage() {
  const { y } = useScrollDepth(8);
  const heroLift = Math.min(y, 320);

  return (
    <div className="home-shell min-h-screen text-slate-100">
      <SiteHeader />

      <section className="relative overflow-hidden px-6 pb-16 pt-12 sm:pt-16 lg:pb-20 lg:pt-20">
        <div
          aria-hidden="true"
          className="home-grid-overlay pointer-events-none absolute inset-0 opacity-70"
        />
        <div aria-hidden="true" className="home-hero-deco pointer-events-none absolute inset-0" />
        <div aria-hidden="true" className="home-hero-scan pointer-events-none absolute inset-0" />
        <div
          aria-hidden="true"
          className="home-hero-scan home-hero-scan--secondary pointer-events-none absolute inset-0"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[340px] bg-[linear-gradient(180deg,rgba(15,23,42,0.05)_0%,rgba(15,23,42,0)_100%)]"
        />

        <div className="relative mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <ScrollReveal delayMs={60}>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" />
              A sharper way to prepare for jobs
            </div>

            <h1 className="mt-6 max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Paste a job link. Get a stronger application in minutes.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Career Readiness turns a role description into a clear rewrite plan, a role-fit score, and the next move
              to make. It feels like a strategy console, not another resume form.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/create" className="crp-btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 text-sm">
                Start a scan
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
              {["JD Scan", "Resume Rewrite", "Skill Gaps", "Interview Preparation"].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  {item}
                </span>
              ))}
            </div>
          </ScrollReveal>

          <div style={{ transform: `translate3d(0, ${Math.max(-8, heroLift * -0.03)}px, 0)` }}>
            <ScrollReveal delayMs={180} className="home-demo-shell relative overflow-hidden rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-cyan-400/15 px-2 py-1 font-semibold text-cyan-200">Live preview</span>
                <span>Job-to-offer workflow</span>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-medium text-slate-200">
                Updated just now
              </span>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-4">
                  <div className="rounded-xl border border-white/10 bg-white/6 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-white">Senior Product Designer</p>
                        <p className="mt-1 text-xs text-slate-300">Remote, product-led team, mid-level scope</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Role fit</p>
                        <p className="mt-1 text-3xl font-extrabold text-white">84</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {previewStats.map((metric) => (
                        <div key={metric.label}>
                          <div className="flex items-center justify-between text-[11px] text-slate-300">
                            <span>{metric.label}</span>
                            <span>{metric.value}/100</span>
                          </div>
                          <div className="mt-1 h-2 rounded-full bg-white/10">
                            <div
                              className="h-2 rounded-full"
                              style={{ width: `${metric.value}%`, backgroundColor: metric.color } as CSSProperties}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/6 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                      <BarChart3 className="h-3.5 w-3.5" />
                      Missing signals
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["stakeholder alignment", "launch metrics", "research synthesis", "handoff ownership"].map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-medium text-cyan-100"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-300">
                      The scan keeps the language concrete, so you know exactly which signals need more weight before you apply.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-white/10 bg-slate-950/90 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        <Wand2 className="h-3.5 w-3.5 text-cyan-300" />
                        Rewrite preview
                      </div>
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
                        +31% impact signal
                      </span>
                    </div>

                    <div className="mt-4 space-y-3 text-sm leading-relaxed">
                      <div className="rounded-lg border border-white/8 bg-white/5 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Before</p>
                        <p className="mt-2 text-slate-300">
                          <span className="line-through decoration-rose-400/80 decoration-2">
                            Worked on onboarding process and reporting.
                          </span>
                        </p>
                      </div>
                      <div className="rounded-lg border border-emerald-400/15 bg-emerald-400/10 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">After</p>
                        <p className="mt-2 text-white">
                          Improved onboarding completion by 31% by redesigning the handoff flow and tracking first-week drop-off.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-gradient-to-br from-cyan-500 to-indigo-600 p-4 text-white shadow-[0_18px_45px_-28px_rgba(37,99,235,0.6)]">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Next move
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-cyan-50">
                      Add evidence for leadership, replace generic task language, and raise the match score with role-specific terms.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-16">
        <ScrollReveal className="max-w-3xl" delayMs={40}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Why It Stands Out</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Built to feel more like a product cockpit than a marketing site
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
            The goal is not just to say what the platform does. It should show the job search loop, the transformation,
            and the next action in a way that feels immediate.
          </p>
        </ScrollReveal>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {differentiators.map((item, index) => (
            <ScrollReveal
              key={item.title}
              as="article"
              delayMs={90 + index * 90}
              className="home-panel p-5 sm:p-6"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                <Layers3 className="h-3.5 w-3.5 text-cyan-300" />
                Product signal
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.description}</p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-slate-950/70 py-16">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 lg:grid-cols-[0.9fr_0.18fr_0.9fr] lg:items-stretch">
          <ScrollReveal delayMs={60} className="home-panel p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Before</p>
            <h3 className="mt-3 text-xl font-bold text-white">A generic bullet list</h3>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300">
              <p>Worked on onboarding process and supported reporting tasks.</p>
              <p>Collaborated with the team and helped improve the workflow.</p>
              <p>Assisted with stakeholder requests and weekly updates.</p>
            </div>
          </ScrollReveal>

          <div className="flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 text-cyan-700 shadow-[0_12px_28px_-20px_rgba(6,182,212,0.55)]">
              <ArrowRight className="h-5 w-5 lg:hidden" />
              <TrendingUp className="hidden h-5 w-5 lg:block" />
            </div>
          </div>

          <ScrollReveal delayMs={140} className="home-panel p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">After</p>
            <h3 className="mt-3 text-xl font-bold text-white">A sharper, more credible story</h3>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300">
              <p>
                <span className="font-semibold text-white">Reduced onboarding drop-off by 31%</span> by redesigning the
                handoff flow and clarifying the first-week path.
              </p>
              <p>
                <span className="font-semibold text-white">Improved weekly reporting</span> by standardizing the metrics
                that stakeholders actually used.
              </p>
              <p>
                <span className="font-semibold text-white">Closed the role gap faster</span> by focusing the resume on
                evidence the target job expected to see.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-16">
        <ScrollReveal className="max-w-3xl" delayMs={40}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Who It Helps</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Built for both first-time applicants and people making a strategic move
          </h2>
        </ScrollReveal>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {audiencePanels.map((panel, index) => (
            <ScrollReveal key={panel.badge} as="article" className="home-panel p-6" delayMs={80 + index * 100}>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
                {panel.badge}
              </div>
              <h3 className="mt-4 text-xl font-bold text-white">{panel.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{panel.description}</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                {panel.points.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="relative px-6 py-24">
        <div aria-hidden="true" className="home-cta-deco pointer-events-none absolute inset-0" />
        <div className="relative mx-auto w-full max-w-7xl overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 px-6 py-7 text-white sm:px-8 sm:py-9">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100">
                <Clock3 className="h-3.5 w-3.5" />
                Make every application feel deliberate
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Stop guessing what to fix. Show the right move right away.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                A good homepage should feel like a promise you can touch. This one should show the product, the
                transformation, and the momentum in one glance.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/create"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-slate-100"
              >
                Start a scan
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/gap-analysis"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Explore gap analysis
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { BarChart3, Sparkles, TrendingUp } from "lucide-react";
import { useResumeStore } from "@/store/resumeStore";
import { getDashboardExperience, getPrimaryCTA, getPrimaryCTALink } from "@/lib/personalization";

interface Props {
  userName?: string;
}

export default function HeroCard({ userName }: Props) {
  const careerStage = useResumeStore((s) => s.careerStage);
  const exp = getDashboardExperience(careerStage);
  const cta = getPrimaryCTA(careerStage);
  const href = getPrimaryCTALink(careerStage);
  const widgets = exp.widgets.slice(0, 3);

  return (
    <div className="crp-card crp-card--soft relative overflow-hidden p-4 text-white sm:p-5">
      <div className="relative z-10 grid gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <div>
          <div className="crp-badge inline-flex items-center gap-2 border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
            <Sparkles className="h-3.5 w-3.5" />
            Dashboard cockpit
          </div>

          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {exp.heroTitle}
            {userName ? ` - ${userName}` : ""}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">{exp.heroSubtitle}</p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {widgets.map((widget) => (
              <span
                key={widget}
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-200"
              >
                {widget}
              </span>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link href={href} className="crp-btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm">
              {cta}
              <TrendingUp className="h-4 w-4" />
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-200">
              <BarChart3 className="h-3.5 w-3.5" />
              Live workspace
            </span>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-800/80 bg-slate-900/95 p-3 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.8)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Primary goal</p>
              <p className="mt-1 text-sm font-semibold text-white">{exp.primaryGoal}</p>
            </div>
            <div className="rounded-full border border-emerald-400/20 bg-emerald-400/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
              Synced
            </div>
          </div>

          <div className="mt-3 space-y-2.5">
            {widgets.map((widget, index) => {
              const percent = Math.max(68, 92 - index * 10);
              return (
                <div key={widget}>
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>{widget}</span>
                    <span>{percent}%</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-white/10">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 shadow-[0_0_24px_rgba(34,211,238,0.22)]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Signal depth</p>
              <p className="mt-1.5 text-xl font-extrabold text-white">High</p>
              <p className="mt-1 text-xs text-slate-400">Your latest data is rich enough to prioritize next steps.</p>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Momentum</p>
              <p className="mt-1.5 text-xl font-extrabold text-white">Active</p>
              <p className="mt-1 text-xs text-slate-400">Keep the pipeline moving with the next recommended action.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

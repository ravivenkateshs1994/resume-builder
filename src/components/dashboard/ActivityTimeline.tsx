"use client";

import React from "react";

export default function ActivityTimeline({ items }: { items: any[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-[26px] border border-white/10 bg-slate-950 px-4 py-3.5 text-white shadow-[0_26px_70px_-48px_rgba(15,23,42,0.75)]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-cyan-300">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
              <path d="M4 12h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M12 4v16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">No recent activity yet</p>
            <p className="text-xs text-slate-400">New resumes and analysis will appear here.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-slate-950 p-4 text-white shadow-[0_26px_70px_-48px_rgba(15,23,42,0.75)]">
      <div aria-hidden="true" className="dashboard-hero-deco pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h4 className="text-sm font-bold tracking-tight text-white">Recent activity</h4>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">
            Live
          </span>
        </div>

        <ol className="relative space-y-4 before:absolute before:left-[7px] before:top-1.5 before:h-[calc(100%-0.75rem)] before:w-px before:bg-white/10">
          {items.map((it) => {
            const isAnalysis = !!(it.result || it.jobDescription || it.targetRole);
            const score = isAnalysis ? (it.result?.score != null ? Math.round(it.result.score * 100) : null) : null;
            const label = isAnalysis
              ? it.targetRole || (it.jobDescription ? `${it.jobDescription.slice(0, 60)}...` : "Analysis")
              : it.resumeData?.personalInfo?.fullName || it.title || "Resume";
            const scoreColor =
              score == null
                ? ""
                : score >= 70
                ? "text-emerald-300"
                : score >= 45
                ? "text-amber-300"
                : "text-rose-300";

            return (
              <li key={it.id} className="relative flex items-start gap-4 pl-6">
                <div
                  className={`absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-slate-950 ${
                    isAnalysis ? "bg-cyan-400" : "bg-slate-400"
                  } shadow-[0_0_0_4px_rgba(255,255,255,0.04)]`}
                />

                <div className="flex-1">
                  <p className="text-sm font-semibold leading-tight text-white">{label}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{new Date(it.createdAt).toLocaleString()}</p>
                </div>

                {score != null && <span className={`text-sm font-bold tabular-nums ${scoreColor}`}>{score}%</span>}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

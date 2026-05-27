"use client";

import React from "react";

export default function ActivityTimeline({ items }: { items: any[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="crp-card-soft flex items-center gap-3 px-5 py-4">
        <div className="h-2 w-2 rounded-full bg-slate-300" />
        <p className="text-sm text-slate-500">No recent activity yet.</p>
      </div>
    );
  }

  return (
    <div className="crp-card-soft p-5">
      <h4 className="mb-5 text-sm font-bold tracking-tight text-slate-900">Recent Activity</h4>
      <ol className="relative space-y-5 before:absolute before:left-[7px] before:top-1.5 before:h-[calc(100%-0.75rem)] before:w-px before:bg-slate-200">
        {items.map((it) => {
          const isAnalysis = !!(it.result || it.jobDescription || it.targetRole);
          const score = isAnalysis ? (it.result?.score != null ? Math.round(it.result.score * 100) : null) : null;
          const label = isAnalysis
            ? it.targetRole || (it.jobDescription ? it.jobDescription.slice(0, 60) + "…" : "Analysis")
            : it.resumeData?.personalInfo?.fullName || it.title || "Resume";
          const scoreColor =
            score == null
              ? ""
              : score >= 70
              ? "text-emerald-600"
              : score >= 45
              ? "text-amber-600"
              : "text-rose-500";

          return (
            <li key={it.id} className="relative flex items-start gap-4 pl-6">
              <div className={`absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-white ${isAnalysis ? 'bg-indigo-400' : 'bg-slate-400'} shadow-sm`} />

              <div className="flex-1">
                <p className="text-sm font-semibold leading-tight text-slate-900">{label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{new Date(it.createdAt).toLocaleString()}</p>
              </div>

              {score != null && (
                <span className={`text-sm font-bold tabular-nums ${scoreColor}`}>{score}%</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

"use client";

import React from "react";

interface Stat {
  label: string;
  value: string | number;
  hint?: string;
  trend?: {
    direction: "up" | "down";
    value?: string | number;
  };
}

export default function StatCards({ stats }: { stats: Stat[] }) {
  // Prefer the two totals by label; fallback to the first two stats provided.
  const visible = (stats || []).filter((s) => s.label === "Total Resumes" || s.label === "Analysis Done");
  const show = visible.length > 0 ? visible : (stats || []).slice(0, 2);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {show.map((s) => (
        <div key={s.label} className="crp-card p-5 flex items-center">
          <div className="crp-stat-left-accent" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide truncate">{s.label}</div>
            <div className="mt-3 flex items-baseline justify-between gap-3">
              <div className="text-3xl font-extrabold leading-tight crp-stat-value truncate">{s.value}</div>
              <div className="flex flex-col items-end">
                {s.hint ? <div className="text-sm text-slate-400">{s.hint}</div> : null}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

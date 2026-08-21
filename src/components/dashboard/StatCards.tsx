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
  const visible = (stats || []).filter((s) => s.label === "Total Resumes" || s.label === "Analysis Done");
  const show = visible.length > 0 ? visible : (stats || []).slice(0, 2);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {show.map((s, index) => (
        <div key={s.label} className="crp-dashboard-tile">
          <div className="crp-metric-row">
            <div className="min-w-0">
              <div className="crp-metric-label truncate">{s.label}</div>
              <div className="crp-metric-value mt-2 truncate">{s.value}</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <div className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500" aria-hidden="true" />
              </div>
              {s.hint ? <div className="text-xs text-slate-400">{s.hint}</div> : null}
            </div>
          </div>
          {s.trend ? (
            <div className="crp-metric-trend mt-3">
              <span>{s.trend.direction === "up" ? "▲" : "▼"}</span>
              <span>{typeof s.trend.value === "number" ? `${s.trend.value}%` : s.trend.value}</span>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

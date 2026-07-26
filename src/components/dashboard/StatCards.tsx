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
        <div
          key={s.label}
          className="relative overflow-hidden rounded-[26px] border border-white/10 bg-slate-950 p-4 text-white shadow-[0_26px_70px_-48px_rgba(15,23,42,0.75)]"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-40"
            style={{
              background:
                index === 0
                  ? "radial-gradient(circle at top right, rgba(14,165,233,0.22), transparent 55%)"
                  : "radial-gradient(circle at top right, rgba(99,102,241,0.22), transparent 55%)",
            }}
          />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 truncate">{s.label}</div>
              <div className="mt-2 text-2xl font-extrabold leading-tight text-white truncate">{s.value}</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <div className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500" aria-hidden="true" />
              </div>
              {s.hint ? <div className="text-xs text-slate-400">{s.hint}</div> : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

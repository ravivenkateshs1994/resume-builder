"use client";

import React from "react";

export default function EmptyState({ onCreate }: { onCreate?: () => void }) {
  return (
    <div className="crp-card-soft overflow-hidden p-6 sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-700">
            Start here
          </div>
          <h3 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-950">Build the first version of your career workspace.</h3>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
            Create your first tailored resume to unlock gap analysis, ATS scoring, and a cleaner next step for the role you want.
          </p>

          <button type="button" onClick={onCreate} className="crp-btn-primary mt-5 inline-flex w-full items-center justify-center px-5 py-3 text-sm font-semibold sm:w-auto">
            Create your first resume
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              "Upload once",
              "Tailor faster",
              "Track progress",
            ].map((label, index) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 text-xs font-bold text-white">
                  0{index + 1}
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";

export default function EmptyState({ onCreate }: { onCreate?: () => void }) {
  return (
    <div className="crp-card-soft p-10 text-center">
      <div className="mx-auto max-w-xs">
        {/* Abstract illustration */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-100 to-cyan-100 shadow-inner">
          <svg viewBox="0 0 64 64" className="h-12 w-12 text-indigo-500" fill="none" aria-hidden>
            <rect x="10" y="14" rx="6" width="44" height="36" stroke="currentColor" strokeWidth="2.4" />
            <path d="M10 22h44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M18 30h14M18 38h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="46" cy="46" r="10" fill="currentColor" fillOpacity="0.15" />
            <path d="M46 42v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h3 className="mb-2 text-xl font-extrabold tracking-tight text-slate-900">Start building your career</h3>
        <p className="mb-6 text-sm leading-relaxed text-slate-500">
          Create your first AI-optimized resume to unlock gap analysis, ATS scoring, and tailored recommendations.
        </p>

        <button onClick={onCreate} className="crp-btn-primary w-full py-2.5 text-sm font-semibold">
          Create Your First Resume
        </button>
      </div>
    </div>
  );
}

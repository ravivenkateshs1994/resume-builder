"use client";

import React from "react";
import type { ResumeData } from "@/types/resume";

export default function ResumePreview({ item, onOpen }: { item?: { id: string; title?: string; createdAt?: string; resumeData?: ResumeData }; onOpen?: () => void }) {
  if (!item) {
    return (
      <div className="crp-card-soft flex h-full min-h-[280px] flex-col items-center justify-center gap-3 p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-400">
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="9" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="9" y1="17" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-700">Select a resume to preview</p>
        <p className="text-xs text-slate-400">Click any resume in the list</p>
      </div>
    );
  }

  const r = item.resumeData;
  const skills = r?.skills ?? [];
  const experience = r?.workExperience ?? [];

  return (
    <div className="crp-card-soft p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-slate-900">
            {r?.personalInfo?.fullName || item.title || "Resume"}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {r?.personalInfo?.email ?? ""}{r?.personalInfo?.phone ? ` · ${r.personalInfo.phone}` : ""}
          </p>
          {item.createdAt && (
            <p className="mt-1 text-xs text-slate-400">Saved {new Date(item.createdAt).toLocaleDateString()}</p>
          )}
        </div>

        <div className="flex flex-col items-center rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">ATS Score</p>
          <p className="mt-1 text-3xl font-extrabold text-emerald-700">—</p>
        </div>
      </div>

      {/* Summary */}
      {r?.summary && (
        <p className="mt-4 text-sm leading-relaxed text-slate-600">{r.summary}</p>
      )}

      {/* Skills & Experience */}
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Top Skills</p>
          <div className="flex flex-wrap gap-2">
            {skills.slice(0, 12).map((s, i) => (
              <span key={i} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">{s}</span>
            ))}
            {skills.length === 0 && <p className="text-xs text-slate-400">No skills listed.</p>}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Experience</p>
          <div className="space-y-2">
            {experience.slice(0, 4).map((w: any) => (
              <div key={w.id} className="text-xs">
                <p className="font-semibold text-slate-800">{w.title || ""}{w.company ? ` — ${w.company}` : ""}</p>
                <p className="text-slate-500">{w.startDate || ""}{w.endDate ? ` – ${w.endDate}` : ""}</p>
              </div>
            ))}
            {experience.length === 0 && <p className="text-xs text-slate-400">No experience entries.</p>}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6 flex justify-end">
        <button type="button" onClick={onOpen} className="crp-btn-primary px-5 py-2 text-sm font-semibold">Open in Builder</button>
      </div>
    </div>
  );
}

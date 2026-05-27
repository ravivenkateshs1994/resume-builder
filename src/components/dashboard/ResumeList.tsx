"use client";

import React from "react";
import DashboardItemCard from "@/components/DashboardItemCard";
import type { ResumeData } from "@/types/resume";

interface ResumeRow {
  id: string;
  title: string;
  createdAt: string;
  resumeData: ResumeData;
}

interface AnalysisRow {
  id: string;
  createdAt: string;
  targetRole?: string;
  jobDescription?: string;
  resumeSnapshot?: ResumeData;
  result?: any;
}

export default function ResumeList({ resumes = [], analyses = [], mode = "resumes", query, setQuery, onSelect, loading, selectedId }: {
  resumes?: ResumeRow[];
  analyses?: AnalysisRow[];
  mode?: "resumes" | "analysis";
  query: string;
  setQuery: (s: string) => void;
  onSelect: (id: string) => void;
  loading?: boolean;
  selectedId?: string | null;
}) {
  const isAnalysis = mode === "analysis";
  const items = isAnalysis ? analyses : resumes;

  const filtered = items.filter((it: any) => {
    if (!query) return true;
    const q = query.toLowerCase();
    if (isAnalysis) {
      return (it.targetRole || "").toLowerCase().includes(q) || (it.jobDescription || "").toLowerCase().includes(q);
    }
    return (
      (it.title || "").toLowerCase().includes(q) ||
      (it.resumeData?.personalInfo?.fullName || "").toLowerCase().includes(q) ||
      (it.resumeData?.skills || []).join(" ").toLowerCase().includes(q)
    );
  });

  return (
    <div className="crp-card-soft p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-tight text-slate-900">{isAnalysis ? "Saved analysis" : "Saved Resumes"}</h3>
        <span className="text-xs font-medium text-slate-500">{items.length} total</span>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.6" />
          <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isAnalysis ? "Search analysis, job titles..." : "Search resumes, skills…"}
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300/60"
        />
      </div>

      {/* Skeleton loader */}
      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {filtered.map((it: any) => {
          if (isAnalysis) {
            return (
              <DashboardItemCard
                key={it.id}
                id={it.id}
                title={it.targetRole || it.jobDescription || "Analysis"}
                meta={`${new Date(it.createdAt).toLocaleString()}`}
                compact
                selected={selectedId === it.id}
                onClick={() => onSelect(it.id)}
              />
            );
          }
          return (
            <DashboardItemCard
              key={it.id}
              id={it.id}
              title={it.resumeData?.personalInfo?.fullName || it.title}
              meta={`${new Date(it.createdAt).toLocaleString()}`}
              compact
              selected={selectedId === it.id}
              onClick={() => onSelect(it.id)}
            />
          );
        })}

        {filtered.length === 0 && !loading && (
          <div className="py-10 text-center text-sm text-slate-500">
            {query ? `No results for "${query}"` : isAnalysis ? "No saved analysis yet." : "No saved resumes yet."}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React from "react";

interface Props {
  id?: string;
  title: string;
  meta?: string;
  excerpt?: string;
  primaryLabel?: string;
  onView?: () => void;
  onPrimary?: () => void;
  onDelete?: () => void;
}

export default function DashboardItemCard({ id, title, meta, excerpt, primaryLabel = "Open", onView, onPrimary, onDelete }: Props) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-white p-3 shadow-sm hover:shadow-md">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-indigo-50 p-2 text-indigo-600">
            {/* briefcase / role icon (Heroicons outline briefcase) */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V6a4 4 0 014-4h0a4 4 0 014 4v1m-12 0h12M3 10h18v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">{title}</div>
            {meta && <div className="mt-1 text-xs text-slate-500">{meta}</div>}
          </div>
        </div>
        {excerpt && <div className="mt-2 text-xs text-slate-600 truncate max-w-xl">{excerpt}</div>}
      </div>

      <div className="ml-4 flex gap-2">
        {onView && (
          <button onClick={onView} className="rounded text-xs text-indigo-600 underline">
            View
          </button>
        )}
        {onPrimary && (
          <button onClick={onPrimary} className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
            {primaryLabel}
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            <span className="sr-only">Delete</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="inline h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 7h12M10 11v6m4-6v6M9 7V6a2 2 0 012-2h2a2 2 0 012 2v1" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

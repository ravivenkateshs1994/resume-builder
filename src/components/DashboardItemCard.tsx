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
  onClick?: () => void;
  compact?: boolean;
  selected?: boolean;
}

export default function DashboardItemCard({ title, meta, excerpt, primaryLabel = "Open", onView, onPrimary, onDelete, onClick, compact = false, selected = false }: Props) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!compact) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  }

  return (
    <div
      className={`crp-card crp-list-item flex items-center justify-between gap-4 p-4 ${compact ? 'cursor-pointer' : 'hover:shadow-md'} ${selected ? 'crp-list-item-selected' : ''}`}
      onClick={compact ? onClick : undefined}
      role={compact ? "button" : undefined}
      tabIndex={compact ? 0 : undefined}
      onKeyDown={handleKeyDown}
      aria-pressed={compact ? (selected ? true : false) : undefined}
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V6a4 4 0 014-4h0a4 4 0 014 4v1m-12 0h12M3 10h18v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7z" />
          </svg>
        </div>

        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900 truncate">{title}</div>
          {meta && <div className="mt-1 text-xs text-slate-500 truncate">{meta}</div>}
          {!compact && excerpt && <div className="mt-2 text-xs text-slate-600 truncate">{excerpt}</div>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!compact && (
          <>
            {onView && (
              <button type="button" onClick={onView} className="text-sm text-indigo-600 underline">View</button>
            )}
            {onPrimary && (
              <button type="button" onClick={onPrimary} className="crp-btn-primary px-3 py-1 text-sm font-semibold">{primaryLabel}</button>
            )}
          </>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className={`crp-btn-ghost px-3 py-1 text-sm font-semibold text-slate-700 ${compact ? "ml-2" : ""}`}
          >
            <span className="sr-only">Delete</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="inline h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 7h12M10 11v6m4-6v6M9 7V6a2 2 0 012-2h2a2 2 0 012 2v1" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

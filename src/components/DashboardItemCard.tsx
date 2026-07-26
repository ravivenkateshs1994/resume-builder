"use client";

import React from "react";
import { Trash2 } from "lucide-react";

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

  if (compact) {
    return (
      <div
        className={`crp-card crp-list-item flex items-center gap-3 overflow-hidden p-4 ${compact ? "cursor-pointer" : "hover:shadow-md"} ${
          selected ? "crp-list-item-selected" : ""
        }`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-pressed={selected ? true : false}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V6a4 4 0 014-4h0a4 4 0 014 4v1m-12 0h12M3 10h18v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7z" />
          </svg>
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="block truncate text-sm font-semibold text-slate-900">{title}</div>
          {meta && <div className="mt-1 block truncate text-xs text-slate-500">{meta}</div>}
        </div>

        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete"
            title="Delete"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 shadow-sm transition hover:border-rose-300 hover:bg-rose-100 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-300/70"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Delete</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`crp-card crp-list-item flex items-center justify-between gap-4 overflow-hidden p-4 ${compact ? 'cursor-pointer' : 'hover:shadow-md'} ${selected ? 'crp-list-item-selected' : ''}`}
      onClick={compact ? onClick : undefined}
      role={compact ? "button" : undefined}
      tabIndex={compact ? 0 : undefined}
      onKeyDown={handleKeyDown}
      aria-pressed={compact ? (selected ? true : false) : undefined}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V6a4 4 0 014-4h0a4 4 0 014 4v1m-12 0h12M3 10h18v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7z" />
          </svg>
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="block truncate text-sm font-semibold text-slate-900">{title}</div>
          {meta && <div className="mt-1 block truncate text-xs text-slate-500">{meta}</div>}
          {!compact && excerpt && <div className="mt-2 text-xs text-slate-600 truncate">{excerpt}</div>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!compact && (
          <>
            {onView && (
              <button type="button" onClick={onView} className="text-sm text-indigo-600 underline">
                View
              </button>
            )}
            {onPrimary && (
              <button type="button" onClick={onPrimary} className="crp-btn-primary px-3 py-1 text-sm font-semibold">
                {primaryLabel}
              </button>
            )}
          </>
        )}

        {onDelete && !compact && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete"
            title="Delete"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 shadow-sm transition hover:border-rose-300 hover:bg-rose-100 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-300/70"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Delete</span>
          </button>
        )}
      </div>
    </div>
  );
}

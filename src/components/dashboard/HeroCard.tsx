"use client";

import React from "react";

interface Props {
  userName?: string;
  onCreate?: () => void;
  onUpload?: () => void;
}

export default function HeroCard({ userName, onCreate, onUpload }: Props) {
  return (
    <div className="crp-card-soft crp-module-accent p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1">
        <h2 className="crp-section-title">Welcome back, {userName ?? "User"} <span className="ml-2 inline">👋</span></h2>
        <p className="crp-section-copy mt-2 max-w-2xl">Build ATS-optimized resumes, identify skill gaps, and improve interview readiness with AI.</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:block">
          {/* Abstract AI illustration / analytics graphic */}
          <svg viewBox="0 0 160 120" className="h-20 w-20" aria-hidden>
            <defs>
              <linearGradient id="g1" x1="0" x2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <rect x="6" y="10" rx="14" ry="14" width="120" height="80" fill="url(#g1)" opacity="0.12" />
            <g transform="translate(20,18)">
              <rect x="0" y="8" rx="6" width="36" height="12" fill="#fff" opacity="0.85" />
              <rect x="44" y="0" rx="6" width="20" height="38" fill="#fff" opacity="0.85" />
              <circle cx="110" cy="24" r="8" fill="#fff" opacity="0.85" />
            </g>
          </svg>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onCreate?.()}
            className="crp-btn-primary px-3 py-2 text-sm"
          >
            Create Resume
          </button>
          <button
            onClick={() => onUpload?.()}
            className="crp-btn-ghost px-3 py-2 text-sm"
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

type RecommendationTooltipProps = {
  id: string;
  reason: string;
  className?: string;
};

export default function RecommendationTooltip({ id, reason, className = "" }: RecommendationTooltipProps) {
  if (!reason) return null;

  return (
    <div className={`group/tooltip relative inline-flex ${className}`}>
      <button
        type="button"
        aria-label="Why this template is recommended"
        aria-describedby={id}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-violet-200/70 bg-white/85 text-[11px] font-semibold text-violet-700 shadow-sm transition-colors hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 md:h-5 md:w-5 md:min-h-0 md:min-w-0 dark:border-violet-400/40 dark:bg-slate-900 dark:text-violet-200"
      >
        i
      </button>

      <div
        id={id}
        role="tooltip"
        className="pointer-events-none absolute right-0 top-[calc(100%+8px)] z-20 w-60 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-700 opacity-0 shadow-xl transition-opacity duration-200 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        {reason}
      </div>
    </div>
  );
}

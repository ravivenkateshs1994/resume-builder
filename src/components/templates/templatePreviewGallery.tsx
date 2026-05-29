"use client";

import { memo } from "react";
import { useResumeStore } from "@/store/resumeStore";
import AccentColorPicker from "@/components/AccentColorPicker";
import RecommendationTooltip from "@/components/ui/RecommendationTooltip";
import { getDefaultTemplateAccent } from "@/lib/templateTheme";
import { TemplateThumbnail } from "@/components/template-gallery/TemplateThumbnail";
import type { TemplateId } from "@/types/resume";
import {
  TEMPLATE_CATALOG,
  type TemplateCatalogItem,
  type TemplateCategory,
} from "@/lib/templateCatalog";

export { TEMPLATE_CATALOG };
export type { TemplateCatalogItem, TemplateCategory };

// ── TemplatePreviewCard ────────────────────────────────────────────────────
// Thin card wrapper + thumbnail; used by TemplateGalleryCard and external callers.

const TemplatePreviewCardInner = ({
  template,
}: {
  template: TemplateCatalogItem;
}) => {
  const { selectedTemplate, templateAccentColor } = useResumeStore();
  const accentColor =
    selectedTemplate === template.id
      ? templateAccentColor
      : getDefaultTemplateAccent(template.id);

  return (
    <div className="max-w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-2 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.32)]">
      <TemplateThumbnail
        templateId={template.id as TemplateId}
        accentColor={accentColor}
        className="rounded-xl"
      />
    </div>
  );
};

export const TemplatePreviewCard = memo(TemplatePreviewCardInner);

// ── TemplateGalleryCard ────────────────────────────────────────────────────
// Full gallery card used in the grid and sidebar variants.

export function TemplateGalleryCard({
  template,
  isSelected = false,
  onSelect,
  onPreview,
  isPremium,
  atsScore,
  recommendedFor,
  isRecommended,
  matchScore,
  recommendationReason,
  badgeType,
  locked,
  variant = "grid",
}: {
  template: TemplateCatalogItem;
  isSelected?: boolean;
  onSelect: () => void;
  onPreview?: () => void;
  isPremium?: boolean;
  atsScore?: number;
  recommendedFor?: string[];
  isRecommended?: boolean;
  matchScore?: number;
  recommendationReason?: string;
  badgeType?: string;
  locked?: boolean;
  variant?: "grid" | "sidebar";
}) {
  const premium = isPremium ?? template.isPremium;
  const score = atsScore ?? template.atsScore ?? 0;
  const roles = recommendedFor ?? template.recommendedFor;
  const selectedState = isSelected ?? false;
  const cardLocked = locked ?? false;
  const recommended = Boolean(isRecommended);
  const recommendationScore = matchScore ?? score;

  const { selectedTemplate, templateAccentColor } = useResumeStore();
  const accentColor =
    selectedTemplate === template.id
      ? templateAccentColor
      : getDefaultTemplateAccent(template.id);

  // ── Sidebar variant ──────────────────────────────────────────────────────
  if (variant === "sidebar") {
    return (
      <div
        onClick={onSelect}
        className={[
          "crp-template-card flex h-full max-w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_24px_45px_-28px_rgba(99,102,241,0.28)]",
          premium ? "crp-premium-card" : "",
          selectedState
            ? "ring-2 ring-indigo-500 shadow-md shadow-indigo-100"
            : recommended
              ? "ring-1 ring-violet-300 shadow-[0_18px_38px_-24px_rgba(99,102,241,0.3)]"
              : "ring-0",
        ].join(" ")}
      >
        {recommended && (
          <div className="mb-2 flex items-start justify-between gap-2">
            <span className="crp-ai-pick-badge" aria-label={`AI pick ${recommendationScore}% match`}>
              <span className="text-[11px]">✨ AI Pick</span>
              <span className="text-[10px] opacity-95">{recommendationScore}% Match</span>
            </span>
            <RecommendationTooltip
              id={`recommendation-reason-${template.id}-sidebar`}
              reason={
                recommendationReason ||
                "Recommended based on role relevance, ATS compatibility, and formatting quality."
              }
            />
          </div>
        )}

        {/* Preview — fills available flex space */}
        <div className="min-h-0 flex-1 rounded-xl border border-slate-200/80 bg-white p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          <TemplateThumbnail
            templateId={template.id as TemplateId}
            accentColor={accentColor}
            className={[
              "rounded-lg",
              selectedState ? "ring-2 ring-inset ring-indigo-400" : "",
            ].join(" ")}
          />
        </div>

        {/* Footer */}
        <div className="mt-3 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {premium && (
              <span className="crp-premium-badge">{badgeType || template.premiumBadgeType || "Premium"}</span>
            )}
            {score > 0 && <span className="crp-ats-badge">ATS {score}</span>}
            {selectedState && (
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">Selected</span>
            )}
          </div>
          <p className="mt-2 break-words text-sm font-semibold tracking-tight text-slate-900">
            {template.name}
          </p>
          <p className="mt-0.5 break-words text-xs leading-relaxed text-slate-600">{template.style}</p>
          <div className="mt-2 flex flex-wrap gap-1" aria-label="Template strengths">
            {template.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-slate-200 bg-white/85 px-2 py-0.5 text-[10px] text-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>
          {!!roles.length && (
            <div className="mt-2 flex flex-wrap gap-1">
              {roles.slice(0, 2).map((role) => (
                <span
                  key={role}
                  className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] text-indigo-700"
                >
                  {role}
                </span>
              ))}
            </div>
          )}
          {cardLocked && (
            <div className="mt-1 text-[10px] text-amber-700">Premium access coming soon</div>
          )}
          <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {onPreview && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview();
                }}
                className="min-h-[40px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Preview
              </button>
            )}
            <div className="min-w-0 flex-1">
              <AccentColorPicker templateId={template.id as TemplateId} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Grid variant (default) ────────────────────────────────────────────────
  return (
    <div
      onClick={onSelect}
      className={[
        "crp-template-card flex h-full max-w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_24px_48px_-30px_rgba(15,23,42,0.22)]",
        premium ? "crp-premium-card" : "",
        selectedState
          ? "ring-2 ring-indigo-500 shadow-md shadow-indigo-100"
          : recommended
            ? "ring-1 ring-violet-300 shadow-[0_20px_42px_-22px_rgba(99,102,241,0.32)]"
            : "ring-0",
      ].join(" ")}
    >
      {/* Top badge row */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {recommended && (
            <span className="crp-ai-pick-badge" aria-label={`AI pick ${recommendationScore}% match`}>
              <span className="text-[11px]">✨ AI Pick</span>
              <span className="text-[10px] opacity-95">{recommendationScore}% Match</span>
            </span>
          )}
          {premium && (
            <span className="crp-premium-badge">{badgeType || template.premiumBadgeType || "Premium"}</span>
          )}
          {score > 0 && <span className="crp-ats-badge">ATS {score}</span>}
        </div>
        <div className="flex items-center gap-2">
          {recommended && (
            <RecommendationTooltip
              id={`recommendation-reason-${template.id}`}
              reason={
                recommendationReason ||
                "Recommended based on role relevance, ATS compatibility, and formatting quality."
              }
            />
          )}
          {selectedState && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-sm">
              ✓
            </span>
          )}
        </div>
      </div>

      {/* Preview — A4 aspect ratio, fills card width */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        <TemplateThumbnail
          templateId={template.id as TemplateId}
          accentColor={accentColor}
          className={[
            "rounded-lg shadow-sm",
            selectedState ? "ring-2 ring-inset ring-indigo-400" : "",
          ].join(" ")}
        />
      </div>

      {/* Footer */}
      <div className="mt-3 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="break-words text-sm font-semibold tracking-tight text-slate-900">
              {template.name}
            </p>
            <p className="mt-0.5 break-words text-xs leading-relaxed text-slate-500">
              {template.description}
            </p>
          </div>
          {selectedState && (
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">Selected</span>
          )}
        </div>
        {!!roles.length && (
          <div className="mt-2 flex flex-wrap gap-1">
            {roles.slice(0, 2).map((role) => (
              <span
                key={role}
                className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] text-indigo-700"
              >
                {role}
              </span>
            ))}
          </div>
        )}
        <div className="mt-1.5 flex flex-wrap gap-1" aria-label="Template strengths">
          {template.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-slate-200 bg-white/85 px-2 py-0.5 text-[10px] text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>
        {cardLocked && (
          <div className="mt-1 text-xs text-amber-700">Premium locking will be enabled soon.</div>
        )}
        <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {onPreview && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPreview();
              }}
              className={[
                "min-h-[40px] flex-1 rounded-xl border bg-white px-3 py-2 text-xs font-semibold transition-colors",
                premium
                  ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              Preview
            </button>
          )}
          <div className="min-w-0 flex-1">
            <AccentColorPicker templateId={template.id as TemplateId} />
          </div>
        </div>
      </div>
    </div>
  );
}

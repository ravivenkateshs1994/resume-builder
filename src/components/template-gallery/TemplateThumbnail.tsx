"use client";

import Image from "next/image";
import { memo, useEffect, useState } from "react";
import type { TemplateId } from "@/types/resume";
import { DEFAULT_TEMPLATE_ACCENTS } from "@/lib/templateTheme";

interface TemplateThumbnailProps {
  templateId: TemplateId;
  accentColor?: string;
  /** Extra Tailwind classes applied to the outer container. */
  className?: string;
}

/** Resolve which PNG to load based on the active accent color.
 *  Default color → /template-previews/{id}.png
 *  Custom color  → /template-previews/{id}-{hex}.png  (e.g. modern-7c3aed.png)
 */
function resolvePngSrc(templateId: TemplateId, accentColor?: string): string {
  const defaultColor = DEFAULT_TEMPLATE_ACCENTS[templateId];
  const color = accentColor?.trim().toLowerCase();
  const isDefault = !color || color === defaultColor.toLowerCase();
  if (isDefault) return `/template-previews/${templateId}.png`;
  const hex = color.replace(/^#/, "");
  return `/template-previews/${templateId}-${hex}.png`;
}

// ── Static PNG thumbnail ─────────────────────────────────────────────────────

function StaticThumbnail({
  src,
  templateId,
  className,
  onError,
}: {
  src: string;
  templateId: TemplateId;
  className: string;
  onError: () => void;
}) {
  return (
    <div className={`relative w-full bg-white ${className}`} style={{ aspectRatio: "210 / 297" }}>
      <Image
        src={src}
        alt={`${templateId} template preview`}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-contain object-top"
        onError={onError}
        priority={false}
      />
    </div>
  );
}

// ── Placeholder when PNG is unavailable ─────────────────────────────────────

function ThumbnailPlaceholder({ className }: { className: string }) {
  return (
    <div
      className={`relative flex w-full items-center justify-center bg-slate-100 ${className}`}
      style={{ aspectRatio: "210 / 297" }}
    >
      <div className="flex flex-col items-center gap-2 text-slate-400">
        <svg width="32" height="40" viewBox="0 0 32 40" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="30" height="38" rx="3" stroke="currentColor" strokeWidth="1.5" />
          <line x1="7" y1="12" x2="25" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="7" y1="18" x2="25" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="7" y1="24" x2="20" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="text-[10px] font-medium">Preview unavailable</span>
      </div>
    </div>
  );
}

// ── Composed component ───────────────────────────────────────────────────────

/**
 * Template gallery thumbnail — static PNG only, no live render.
 *
 * Loads /template-previews/{id}.png for the default color, or
 * /template-previews/{id}-{hex}.png for a preset color variant.
 * Falls back to the SVG placeholder if the PNG is missing.
 *
 * Generate all PNGs with: npm run generate-thumbnails
 */
function TemplateThumbnailInner({
  templateId,
  accentColor,
  className = "",
}: TemplateThumbnailProps) {
  const src = resolvePngSrc(templateId, accentColor);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  // Reset failure when the resolved src changes (template or color change)
  useEffect(() => { setFailedSrc(null); }, [src]);

  if (failedSrc !== src) {
    return (
      <StaticThumbnail
        src={src}
        templateId={templateId}
        className={className}
        onError={() => setFailedSrc(src)}
      />
    );
  }

  return <ThumbnailPlaceholder className={className} />;
}

export const TemplateThumbnail = memo(TemplateThumbnailInner);

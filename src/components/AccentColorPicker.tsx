"use client";

import { useResumeStore } from "@/store/resumeStore";
import type { TemplateId } from "@/types/resume";
import { PER_TEMPLATE_PRESETS, hexToRgb } from "@/lib/templateTheme";

interface Props {
  templateId: TemplateId;
  onColorSelect?: () => void;
}

/**
 * Inline color-dot row shown on each template card.
 * Clicking a dot selects both the template and its accent color.
 * Returns null when the template has no curated color options.
 */
export default function AccentColorPicker({ templateId, onColorSelect }: Props) {
  const { templateAccentColor, setTemplateAccentColor, selectedTemplate, setSelectedTemplate } =
    useResumeStore();

  const presets = PER_TEMPLATE_PRESETS[templateId] ?? [];
  if (!presets.length) return null;

  const isCardSelected = selectedTemplate === templateId;
  const isDarkSwatch = (color: string) => {
    const rgb = hexToRgb(color);
    if (!rgb) return false;

    const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
    return luminance < 0.22;
  };

  return (
    <div className="flex items-center gap-1.5">
      {presets.map((color) => {
        const isActive = isCardSelected && templateAccentColor.toLowerCase() === color.toLowerCase();
        return (
          <div
            key={color}
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTemplate(templateId);
              setTemplateAccentColor(color);
              onColorSelect?.();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                setSelectedTemplate(templateId);
                setTemplateAccentColor(color);
                onColorSelect?.();
              }
            }}
            className={`w-4 h-4 rounded-full border-2 transition-all ${
              isActive ? "border-slate-800 scale-110 shadow-sm" : "border-slate-300 hover:border-slate-500 hover:scale-105"
            }`}
            style={{
              backgroundColor: color,
              boxShadow: isDarkSwatch(color) ? "inset 0 0 0 1px rgba(255,255,255,0.35)" : undefined,
            }}
            aria-label={`${color} accent`}
            title={color}
          />
        );
      })}
    </div>
  );
}

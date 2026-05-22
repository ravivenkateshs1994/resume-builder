"use client";

import { useResumeStore } from "@/store/resumeStore";
import type { TemplateId } from "@/types/resume";
import { PER_TEMPLATE_PRESETS } from "@/lib/templateTheme";

interface Props {
  templateId: TemplateId;
}

/**
 * Inline color-dot row shown on each template card.
 * Clicking a dot selects both the template and its accent color.
 * Returns null when the template has no curated color options.
 */
export default function AccentColorPicker({ templateId }: Props) {
  const { templateAccentColor, setTemplateAccentColor, selectedTemplate, setSelectedTemplate } =
    useResumeStore();

  const presets = PER_TEMPLATE_PRESETS[templateId] ?? [];
  if (!presets.length) return null;

  const isCardSelected = selectedTemplate === templateId;

  return (
    <div className="flex items-center gap-1.5">
      {presets.map((color) => {
        const isActive =
          isCardSelected && templateAccentColor.toLowerCase() === color.toLowerCase();
        return (
          <button
            key={color}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTemplate(templateId);
              setTemplateAccentColor(color);
            }}
            className={`w-4 h-4 rounded-full border-2 transition-all ${
              isActive
                ? "border-slate-800 scale-110 shadow-sm"
                : "border-slate-300 hover:border-slate-500 hover:scale-105"
            }`}
            style={{ backgroundColor: color }}
            aria-label={`${color} accent`}
            title={color}
          />
        );
      })}
    </div>
  );
}

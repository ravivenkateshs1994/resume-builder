"use client";

import { useResumeStore } from "@/store/resumeStore";
import type { TemplateId, TemplateOption } from "@/types/resume";
import AccentColorPicker from "@/components/AccentColorPicker";

const TEMPLATES: TemplateOption[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean blue accent with two-column header",
    previewColor: "bg-blue-600",
    tags: ["Popular", "ATS-Friendly"],
  },
  {
    id: "classic",
    name: "Classic",
    description: "Traditional single-column, serif font",
    previewColor: "bg-gray-800",
    tags: ["Conservative", "ATS-Friendly"],
  },
  {
    id: "creative",
    name: "Creative",
    description: "Bold violet sidebar with modern layout",
    previewColor: "bg-violet-700",
    tags: ["Design", "Stands Out"],
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean with generous whitespace",
    previewColor: "bg-gray-400",
    tags: ["Simple", "Elegant"],
  },
  {
    id: "executive",
    name: "Executive",
    description: "Dark header, gold accent — corporate prestige",
    previewColor: "bg-gray-900",
    tags: ["Senior", "Corporate"],
  },
  {
    id: "slate",
    name: "Slate",
    description: "Dark sidebar with sky blue accents",
    previewColor: "bg-slate-700",
    tags: ["Modern", "Two-Column"],
  },
  {
    id: "chronos",
    name: "Chronos",
    description: "Timeline-style with teal accents",
    previewColor: "bg-teal-600",
    tags: ["Timeline", "Elegant"],
  },
  {
    id: "terra",
    name: "Terra",
    description: "Warm terracotta with earthy serif style",
    previewColor: "bg-amber-700",
    tags: ["Warm", "Creative"],
  },
  {
    id: "tech",
    name: "Tech",
    description: "Dark header, monospace, cyber-minimal",
    previewColor: "bg-gray-950",
    tags: ["Tech", "Developer"],
  },
  {
    id: "nova",
    name: "Nova",
    description: "Avatar header with vibrant accent banner",
    previewColor: "bg-blue-500",
    tags: ["Photo", "Modern"],
  },
  {
    id: "prism",
    name: "Prism",
    description: "Light sidebar with accent-tinted left panel",
    previewColor: "bg-teal-500",
    tags: ["Two-Column", "Elegant"],
  },
  {
    id: "apex",
    name: "Apex",
    description: "Bold headers, grid skills, ATS-optimized",
    previewColor: "bg-slate-600",
    tags: ["ATS-Friendly", "Clean"],
  },
];

export default function TemplatePicker({ variant = "grid" }: { variant?: "grid" | "sidebar" }) {
  const { selectedTemplate, setSelectedTemplate } = useResumeStore();

  if (variant === "sidebar") {
    return (
      <div className="flex flex-col gap-1.5">
        {TEMPLATES.map((t) => (
          <div
            key={t.id}
            onClick={() => setSelectedTemplate(t.id as TemplateId)}
            className={`flex items-center gap-2.5 border-2 rounded-lg px-2.5 py-2 cursor-pointer transition-all ${
              selectedTemplate === t.id
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className={`w-7 h-7 rounded flex-shrink-0 ${t.previewColor}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-semibold text-gray-800 leading-tight">{t.name}</p>
                {selectedTemplate === t.id && (
                  <span className="text-blue-600 text-[10px] font-bold flex-shrink-0">✓</span>
                )}
              </div>
              <div className="mt-1">
                <AccentColorPicker templateId={t.id as TemplateId} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Choose a Template</h3>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {TEMPLATES.map((t) => (
          <div
            key={t.id}
            onClick={() => setSelectedTemplate(t.id as TemplateId)}
            className={`text-left border-2 rounded-xl p-3 transition-all cursor-pointer ${
              selectedTemplate === t.id
                ? "border-blue-600 shadow-md shadow-blue-100"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {/* Color swatch */}
            <div className={`w-full h-10 rounded-lg ${t.previewColor} mb-2`} />
            <p className="text-xs font-semibold text-gray-800">{t.name}</p>
            <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{t.description}</p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {t.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5"
                >
                  {tag}
                </span>
              ))}
            </div>
            {selectedTemplate === t.id && (
              <div className="mt-1.5 text-blue-600 text-[10px] font-semibold">✓ Selected</div>
            )}
            {/* Per-template color dots */}
            <div className="mt-2">
              <AccentColorPicker templateId={t.id as TemplateId} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


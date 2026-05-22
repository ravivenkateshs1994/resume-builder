import type { TemplateId } from "@/types/resume";

// ─── Per-template curated color presets (all WCAG AA ≥ 4.5:1 on white) ───────
// Empty array = no picker shown (template uses a fixed brand palette).
export const PER_TEMPLATE_PRESETS: Record<TemplateId, string[]> = {
  modern:    ["#2563eb", "#475569", "#7c3aed", "#0f766e", "#0e7490"],
  classic:   ["#475569", "#1e3a5f", "#374151", "#0f766e", "#be123c"],
  creative:  ["#7c3aed", "#2563eb", "#be123c", "#0f766e", "#0e7490"],
  minimal:   ["#4b5563", "#2563eb", "#7c3aed", "#0f766e", "#be123c"],
  executive: ["#111827", "#1e3a5f", "#374151", "#2563eb", "#0f766e"],
  slate:     [], // fixed dark-slate sidebar — no picker
  chronos:   ["#0f766e", "#2563eb", "#7c3aed", "#0e7490", "#475569"],
  terra:     ["#c2410c", "#0f766e", "#7c3aed", "#475569", "#be123c"],
  tech:      [], // fixed dark-cyber palette — no picker
  nova:      ["#2563eb", "#7c3aed", "#be123c", "#0f766e", "#475569"],
  prism:     ["#0f766e", "#2563eb", "#7c3aed", "#475569", "#c2410c"],
  apex:      ["#475569", "#2563eb", "#0f766e", "#7c3aed", "#be123c"],
};

export const DEFAULT_TEMPLATE_ACCENTS: Record<TemplateId, string> = {
  modern:    "#2563eb",
  classic:   "#475569",
  creative:  "#7c3aed",
  minimal:   "#4b5563",
  executive: "#111827",
  slate:     "#0284c7",
  chronos:   "#0f766e",
  terra:     "#c2410c",
  tech:      "#0891b2",
  nova:      "#2563eb",
  prism:     "#0f766e",
  apex:      "#475569",
};

export function getDefaultTemplateAccent(templateId: TemplateId): string {
  return DEFAULT_TEMPLATE_ACCENTS[templateId] ?? DEFAULT_TEMPLATE_ACCENTS.modern;
}

export function normalizeHexColor(input: string): string {
  const trimmed = input.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;

  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    const expanded = withHash
      .slice(1)
      .split("")
      .map((char) => char + char)
      .join("");
    return `#${expanded.toLowerCase()}`;
  }

  if (/^#[0-9a-fA-F]{6}$/.test(withHash)) {
    return withHash.toLowerCase();
  }

  return DEFAULT_TEMPLATE_ACCENTS.modern;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeHexColor(hex).slice(1);
  const value = Number.parseInt(normalized, 16);
  if (Number.isNaN(value)) return null;

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

export function mixColors(first: string, second: string, weight = 0.5): string {
  const a = hexToRgb(first);
  const b = hexToRgb(second);
  if (!a || !b) return normalizeHexColor(first);

  const ratio = Math.max(0, Math.min(1, weight));
  return rgbToHex(
    a.r * ratio + b.r * (1 - ratio),
    a.g * ratio + b.g * (1 - ratio),
    a.b * ratio + b.b * (1 - ratio)
  );
}

export function getReadableTextColor(background: string): string {
  const rgb = hexToRgb(background);
  if (!rgb) return "#ffffff";

  const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return luminance > 0.62 ? "#111827" : "#ffffff";
}

export function createTemplateTheme(accentColor: string) {
  const accent = normalizeHexColor(accentColor);
  const contrast = getReadableTextColor(accent);
  const accentDeep = mixColors(accent, "#000000", 0.82);

  return {
    accent,
    contrast,
    // Use this for text on accentDeep backgrounds (headers/sidebars that use accentDeep as bg)
    contrastDeep: getReadableTextColor(accentDeep),
    accentSoft: mixColors(accent, "#ffffff", 0.14),    // 14% accent + 86% white — light tint for backgrounds
    accentSofter: mixColors(accent, "#ffffff", 0.06),  // 6% accent + 94% white — near-white for text on dark bg
    accentMuted: mixColors(accent, contrast, 0.18),    // was 0.82 (too dark) → now lighter accent-tinted shade
    accentDeep,
    accentBorder: mixColors(accent, "#ffffff", 0.40),  // 40% accent + 60% white — medium accent for borders/dividers
  };
}
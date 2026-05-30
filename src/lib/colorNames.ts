import { normalizeHexColor } from "@/lib/templateTheme";

const COLOR_NAME_MAP: Record<string, string> = {
  "#2563eb": "Blue",
  "#475569": "Slate",
  "#7c3aed": "Violet",
  "#0f766e": "Teal",
  "#0e7490": "Cyan",
  "#4b5563": "Slate",
  "#be123c": "Crimson",
  "#111827": "Black",
  "#c2410c": "Orange",
  "#0891b2": "Teal",
  "#1e40af": "Indigo",
  "#1e3a5f": "Navy",
  "#374151": "Gray",
  "#0284c7": "Sky",
};

export function getColorName(hex?: string | null): string | null {
  if (!hex) return null;
  const normalized = normalizeHexColor(hex).toLowerCase();
  return COLOR_NAME_MAP[normalized] ?? "Custom";
}

export default getColorName;

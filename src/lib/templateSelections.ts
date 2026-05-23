import type { TemplateId } from "@/types/resume";

const selections = new Map<string, TemplateId>();

export function persistTemplateSelection(userKey: string, templateId: TemplateId): void {
  selections.set(userKey, templateId);
}

export function getTemplateSelection(userKey: string): TemplateId | null {
  return selections.get(userKey) ?? null;
}

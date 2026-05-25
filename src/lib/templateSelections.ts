import type { TemplateId } from "@/types/resume";

const selections = new Map<string, TemplateId>();

export function persistTemplateSelection(userKey: string, templateId: TemplateId): void {
  selections.set(userKey, templateId);
}

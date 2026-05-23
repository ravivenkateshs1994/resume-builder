import type { ResumeData, TemplateId } from "@/types/resume";

export type ExportSession = {
  resumeData: ResumeData;
  selectedTemplate: TemplateId;
  templateAccentColor?: string;
  createdAt: number;
};

const SESSION_TTL_MS = 10 * 60 * 1000;

declare global {
  var __resumeExportSessions: Map<string, ExportSession> | undefined;
}

const sessionStore = globalThis.__resumeExportSessions ?? new Map<string, ExportSession>();
globalThis.__resumeExportSessions = sessionStore;

export function createExportSession(payload: Omit<ExportSession, "createdAt">): string {
  const sessionId = crypto.randomUUID();
  sessionStore.set(sessionId, { ...payload, createdAt: Date.now() });

  const timer = setTimeout(() => {
    sessionStore.delete(sessionId);
  }, SESSION_TTL_MS);

  if (typeof (timer as NodeJS.Timeout).unref === "function") {
    (timer as NodeJS.Timeout).unref();
  }

  return sessionId;
}

export function getExportSession(sessionId: string): ExportSession | undefined {
  return sessionStore.get(sessionId);
}

export function deleteExportSession(sessionId: string): void {
  sessionStore.delete(sessionId);
}
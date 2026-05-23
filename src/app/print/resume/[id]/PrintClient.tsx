"use client";

import { useEffect, useState } from "react";
import ResumeRenderer from "@/components/templates/ResumeRenderer";
import { useResumeStore } from "@/store/resumeStore";
import type { ResumeData, TemplateId } from "@/types/resume";

interface PrintClientProps {
  serverData: ResumeData | null;
  serverTemplate: TemplateId | null;
  serverAccentColor: string | null;
}

const PAGE_BACKGROUND_BY_TEMPLATE: Partial<Record<string, string>> = {
  terra: "#fdf8f3",
};

const BLEED_TEMPLATES = new Set([
  "modern",
  "creative",
  "executive",
  "slate",
  "terra",
  "tech",
]);

export default function PrintClient({ serverData, serverTemplate, serverAccentColor }: PrintClientProps) {
  const store = useResumeStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // If server-side session data is available (Puppeteer path), use it directly.
  // Otherwise fall back to the Zustand store (manual browser preview path).
  const resumeData = serverData ?? store.resumeData;
  const selectedTemplate = serverTemplate ?? store.selectedTemplate;
  const templateAccentColor = serverAccentColor ?? store.templateAccentColor;

  const bleedMode = BLEED_TEMPLATES.has(selectedTemplate);
  const pageBackground = PAGE_BACKGROUND_BY_TEMPLATE[selectedTemplate];

  // When using server data we don't need hydration; show immediately.
  const isReady = serverData !== null ? true : hydrated;

  const hasResume =
    isReady &&
    Boolean(
      resumeData.personalInfo.fullName ||
        resumeData.summary ||
        resumeData.skills.length ||
        resumeData.workExperience.length ||
        resumeData.education.length ||
        resumeData.certifications.length
    );

  return (
    <>
      <style>{`
        @page {
          size: A4;
          margin: 0;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #ffffff !important;
        }

        body {
          font-family: var(--font-sans), sans-serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .resume-print-shell {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          background: #ffffff;
          padding: 12mm 12mm;
          box-sizing: border-box;
          position: relative;
        }

        .resume-print-shell[data-bleed='true'] {
          width: 210mm;
          margin: 0;
          padding: 0;
        }

        .resume-print-shell[data-bleed='true'] > div {
          width: 100% !important;
          max-width: none !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
        }

        .resume-print-shell,
        .resume-print-shell [class*='px-'][class*='py-'],
        .resume-print-shell [class*='pt-'][class*='pb-'],
        .resume-print-shell [class*='py-'][class*='px-'] {
          -webkit-box-decoration-break: clone;
          box-decoration-break: clone;
        }

        .resume-print-shell [class*='px-'][class*='py-'],
        .resume-print-shell [class*='pt-'][class*='pb-'],
        .resume-print-shell [class*='py-'][class*='px-'] {
          break-inside: auto;
          page-break-inside: auto;
        }

        .resume-desc ul {
          list-style: disc;
          padding-left: 1.25rem;
          margin-top: 0.25rem;
        }

        .resume-desc ul li {
          margin-bottom: 2px;
        }

        .resume-desc ul li p,
        .resume-desc p {
          margin: 0;
        }

        .resume-desc-minimal ul {
          list-style: none;
          padding-left: 0;
          margin-top: 0.375rem;
        }

        .resume-desc-minimal ul li {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2px;
          color: #4b5563;
        }

        .resume-desc-minimal ul li::before {
          content: '—';
          color: #d1d5db;
          flex-shrink: 0;
        }

        .resume-desc-minimal ul li p,
        .resume-desc-minimal p {
          margin: 0;
        }
      `}</style>
      <div className="resume-print-shell" data-bleed={bleedMode ? "true" : "false"}>
        {pageBackground && (
          <div
            aria-hidden="true"
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: pageBackground,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
        )}
        <div style={{ position: "relative", zIndex: 1 }}>
          {hasResume ? (
            <ResumeRenderer data={resumeData} templateId={selectedTemplate} accentColor={templateAccentColor} />
          ) : (
            <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-slate-300 bg-white px-8 py-12 text-center text-slate-500 shadow-sm">
              Open the builder in this browser to load the saved resume draft for print preview.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

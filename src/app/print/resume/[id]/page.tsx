import { notFound } from "next/navigation";
import Script from "next/script";
import ResumeRenderer from "@/components/templates/ResumeRenderer";
import { getExportSession } from "@/lib/exportSessions";

export const dynamic = "force-dynamic";

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

export default async function PrintResumePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = getExportSession(id);

  if (!session) {
    notFound();
  }

  const bleedMode = BLEED_TEMPLATES.has(session.selectedTemplate);
  const pageBackground = PAGE_BACKGROUND_BY_TEMPLATE[session.selectedTemplate];

  return (
    <>
      <Script
        id="tailwind-config"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              theme: {
                extend: {
                  fontFamily: {
                    sans: ['var(--font-sans)', 'sans-serif'],
                    serif: ['var(--font-serif)', 'serif'],
                  },
                },
              },
            };
          `,
        }}
      />
      <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
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
          <ResumeRenderer data={session.resumeData} templateId={session.selectedTemplate} />
        </div>
      </div>
    </>
  );
}
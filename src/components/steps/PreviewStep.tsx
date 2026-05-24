"use client";

import { useResumeStore } from "@/store/resumeStore";
import TemplatePicker from "@/components/TemplatePicker";
import ResumeRenderer from "@/components/templates/ResumeRenderer";
import { useRef, useState } from "react";

type LegacyNavigator = Navigator & {
  msSaveOrOpenBlob?: (blob: Blob, defaultName?: string) => boolean;
};

function isIOSLikeBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isSafariBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /Safari/i.test(ua) && !/Chrome|CriOS|Android|Edg|Firefox|FxiOS/i.test(ua);
}

async function downloadBlobAcrossBrowsers(blob: Blob, fileName: string, mimeType: string): Promise<void> {
  const legacyNavigator = navigator as LegacyNavigator;

  if (legacyNavigator.msSaveOrOpenBlob) {
    legacyNavigator.msSaveOrOpenBlob(blob, fileName);
    return;
  }

  const iOS = isIOSLikeBrowser();
  const safari = isSafariBrowser();

  // iOS Safari handles Files share/save more reliably than a[download].
  if (iOS && navigator.canShare && navigator.share) {
    try {
      const file = new File([blob], fileName, { type: mimeType });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: fileName });
        return;
      }
    } catch {
      // If sharing is cancelled/unavailable, continue with URL fallback below.
    }
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.rel = "noopener noreferrer";

  if (!iOS && !safari) {
    anchor.download = fileName;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
    return;
  }

  // Safari fallback: open in a new tab so users can use native Save/Share actions.
  const popup = window.open(url, "_blank", "noopener,noreferrer");
  if (!popup) {
    window.location.href = url;
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export default function PreviewStep() {
  const {
    resumeData,
    selectedTemplate,
    templateAccentColor,
    prevStep,
  } = useResumeStore();
  const previewScale = 0.85;

  const [exportingDocx, setExportingDocx] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  async function exportDocx() {
    setExportingDocx(true);
    try {
      const res = await fetch("/api/export/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData, selectedTemplate, templateAccentColor }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || "DOCX export failed");
      }

      const blob = await res.blob();
      await downloadBlobAcrossBrowsers(
        blob,
        `${resumeData.personalInfo.fullName.replace(/\s+/g, "_")}_Resume.docx`,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
    } catch (error) {
      console.error("DOCX export error:", error);
      alert(error instanceof Error ? error.message : "DOCX export failed. Please try again.");
    } finally {
      setExportingDocx(false);
    }
  }

  async function exportPdf() {
    setExportingPdf(true);
    try {
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData, selectedTemplate, templateAccentColor }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || "PDF export failed");
      }

      const blob = await res.blob();
      await downloadBlobAcrossBrowsers(
        blob,
        `${resumeData.personalInfo.fullName.replace(/\s+/g, "_")}_Resume.pdf`,
        "application/pdf"
      );
    } catch (error) {
      console.error("PDF export error:", error);
      alert(error instanceof Error ? error.message : "PDF export failed. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <div className="flex min-h-0 max-w-full flex-col gap-6 overflow-x-hidden lg:flex-row">
      {/* Left sidebar: template picker */}
      <div className="w-full lg:w-52 lg:flex-shrink-0">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Templates</h3>
        <div className="max-h-[40vh] overflow-y-auto pr-0.5 lg:max-h-[calc(100vh-220px)]">
          <TemplatePicker variant="sidebar" />
        </div>
      </div>

      {/* Right: controls + preview */}
      <div className="flex-1 min-w-0">
      <h2 className="mb-1 text-[22px] font-bold text-slate-800 md:text-[30px]">Preview & Export</h2>
      <p className="mb-4 break-words text-sm text-gray-500 md:text-base">
        Review your resume and export it in your preferred format.
      </p>

      {/* Resume Preview */}
      <div className="mb-6 max-w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col items-start justify-between gap-1 border-b border-gray-200 bg-gray-100 px-4 py-2 text-xs text-gray-500 md:flex-row md:items-center">
          <span>Resume Preview</span>
          <span className="break-words text-gray-400 capitalize">{selectedTemplate} template</span>
        </div>
        <div
          ref={previewRef}
          className="max-h-[900px] overflow-y-auto overflow-x-hidden bg-white"
          style={{ zoom: previewScale }}
        >
          <ResumeRenderer data={resumeData} templateId={selectedTemplate} accentColor={templateAccentColor} />
        </div>
      </div>

      {/* Gap Analyzer CTA */}
      <div className="app-panel mb-6 flex flex-col items-start justify-between gap-4 rounded-xl border border-blue-100 p-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold text-slate-800">Analyze skill gaps for a specific role</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare your resume against any job description and get personalized learning resources.
          </p>
        </div>
        <a
          href="/gap-analysis"
          className="min-h-[44px] w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700 md:w-auto"
        >
          Open Gap Analyzer
        </a>
      </div>

      {/* Export Buttons */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:flex-wrap">
        <button
          onClick={exportPdf}
          disabled={exportingPdf}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 md:w-auto"
        >
          {exportingPdf ? "Preparing PDF..." : "Download PDF"}
        </button>
        <button
          onClick={exportDocx}
          disabled={exportingDocx}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-50 md:w-auto"
        >
          {exportingDocx ? "Preparing DOCX..." : "Download DOCX"}
        </button>
      </div>

      <div className="mt-8 flex justify-start">
        <button
          onClick={prevStep}
          className="min-h-[44px] w-full rounded-lg border border-slate-200 px-5 py-2.5 font-medium text-slate-600 transition-colors hover:bg-slate-50 md:w-auto"
        >
          Back
        </button>
      </div>
      </div>{/* end right column */}
    </div>
  );
}


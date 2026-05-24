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
    <div className="flex min-h-0 flex-col gap-6 lg:flex-row">
      {/* Left sidebar: template picker */}
      <div className="w-full lg:w-52 lg:flex-shrink-0">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Templates</h3>
        <div className="max-h-[40vh] overflow-y-auto pr-0.5 lg:max-h-[calc(100vh-220px)]">
          <TemplatePicker variant="sidebar" />
        </div>
      </div>

      {/* Right: controls + preview */}
      <div className="flex-1 min-w-0">
      <h2 className="text-xl font-bold text-slate-800 mb-1">Preview & Export</h2>
      <p className="text-sm text-gray-500 mb-4">
        Review your resume and export it in your preferred format.
      </p>

      {/* Resume Preview */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-6">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 text-xs text-gray-500 flex items-center justify-between">
          <span>Resume Preview</span>
          <span className="text-gray-400 capitalize">{selectedTemplate} template</span>
        </div>
        <div
          ref={previewRef}
          className="overflow-auto max-h-[900px] bg-white"
          style={{ zoom: previewScale }}
        >
          <ResumeRenderer data={resumeData} templateId={selectedTemplate} accentColor={templateAccentColor} />
        </div>
      </div>

      {/* Gap Analyzer CTA */}
      <div className="app-panel mb-6 flex flex-col items-start justify-between gap-4 rounded-xl border border-blue-100 p-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-slate-800">Analyze skill gaps for a specific role</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare your resume against any job description and get personalized learning resources.
          </p>
        </div>
        <a
          href="/gap-analysis"
          className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
        >
          Open Gap Analyzer
        </a>
      </div>

      {/* Export Buttons */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          onClick={exportPdf}
          disabled={exportingPdf}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 sm:w-auto"
        >
          PDF {exportingPdf ? "Preparing PDF..." : "Download PDF"}
        </button>
        <button
          onClick={exportDocx}
          disabled={exportingDocx}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-50 sm:w-auto"
        >
          DOCX {exportingDocx ? "Exporting..." : "Download DOCX"}
        </button>
      </div>

      <div className="mt-8 flex justify-start">
        <button
          onClick={prevStep}
          className="w-full rounded-lg border border-slate-200 px-5 py-2.5 font-medium text-slate-600 transition-colors hover:bg-slate-50 sm:w-auto"
        >
          Back
        </button>
      </div>
      </div>{/* end right column */}
    </div>
  );
}


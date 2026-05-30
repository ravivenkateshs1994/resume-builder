"use client";

import { useResumeStore } from "@/store/resumeStore";
import Link from "next/link";
import AccentColorPicker from "@/components/AccentColorPicker";
import ResumeRenderer from "@/components/templates/ResumeRenderer";
import { TEMPLATE_CATALOG, getTemplateById } from "@/lib/templateCatalog";
import { useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

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
    setSelectedTemplate,
    templateAccentColor,
    prevStep,
  } = useResumeStore();

  const [exportingDocx, setExportingDocx] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [docxError, setDocxError] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [cloudSaving, setCloudSaving] = useState(false);
  const [cloudSaveMessage, setCloudSaveMessage] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  async function saveResumeToCloud() {
    setCloudSaveMessage(null);
    setCloudSaving(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setCloudSaveMessage("Please log in from Analysis workspace first, then save again.");
        return;
      }

      const response = await fetch("/api/cloud/resumes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // Attach template metadata so cloud copies include the chosen template name and accent color
        body: JSON.stringify({
            title: resumeData.personalInfo.fullName || resumeData.personalInfo.jobTitle || "Resume Draft",
            resumeData: {
              ...resumeData,
              template: {
                id: selectedTemplate,
                name: getTemplateById(selectedTemplate)?.name || selectedTemplate,
                accentColor: templateAccentColor,
              },
            },
          }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Failed to save resume.");

      setCloudSaveMessage("Resume saved to cloud.");
    } catch (error) {
      setCloudSaveMessage(error instanceof Error ? error.message : "Failed to save resume.");
    } finally {
      setCloudSaving(false);
    }
  }

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
      setDocxError(error instanceof Error ? error.message : "DOCX export failed. Please try again.");
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
      setPdfError(error instanceof Error ? error.message : "PDF export failed. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <div className="flex min-h-0 max-w-full flex-col gap-6 overflow-x-hidden">
      <div>
        <h2 className="mb-1 text-[22px] font-bold text-slate-800 md:text-[30px]">Preview & Export</h2>
        <p className="mb-6 break-words text-sm text-gray-500 md:text-base">
          Choose your template and accent color, then export your resume.
        </p>
      </div>

      {/* Template + Color selection */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <p className="mb-3 text-sm font-semibold text-slate-700">Template</p>
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_CATALOG.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTemplate(t.id)}
              className={[
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                selectedTemplate === t.id
                  ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50",
              ].join(" ")}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div className="mt-5 border-t border-slate-200 pt-4">
          <p className="mb-2.5 text-sm font-semibold text-slate-700">Accent Color</p>
          <AccentColorPicker templateId={selectedTemplate} />
        </div>
      </div>

      {/* Resume Preview */}
      <div className="max-w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 px-4 py-2 text-xs text-gray-500">
          <span>Resume Preview</span>
          <span className="capitalize text-gray-400">{selectedTemplate} template</span>
        </div>
        <div
          ref={previewRef}
          className="max-h-[700px] overflow-y-auto overflow-x-hidden bg-white"
          style={{ zoom: 0.75 }}
        >
          <ResumeRenderer data={resumeData} templateId={selectedTemplate} accentColor={templateAccentColor} />
        </div>
      </div>

      {/* Gap Analyzer CTA */}
      <div className="app-panel flex flex-col items-start justify-between gap-4 rounded-xl border border-blue-100 p-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold text-slate-800">Analyze skill gaps for a specific role</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Compare your resume against any job description and get personalized learning resources.
          </p>
        </div>
        <Link
          href="/gap-analysis/analysis"
          className="min-h-[44px] w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700 md:w-auto"
        >
          Open Gap Analyzer
        </Link>
      </div>

      {/* Export Buttons */}
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
        <button
          type="button"
          onClick={exportPdf}
          disabled={exportingPdf}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 md:w-auto"
        >
          {exportingPdf ? "Preparing PDF..." : "Download PDF"}
        </button>
        <button
          type="button"
          onClick={exportDocx}
          disabled={exportingDocx}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-50 md:w-auto"
        >
          {exportingDocx ? "Preparing DOCX..." : "Download DOCX"}
        </button>
        <button
          type="button"
          onClick={saveResumeToCloud}
          disabled={cloudSaving}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 md:w-auto"
        >
          {cloudSaving ? "Saving..." : "Save Resume to Cloud"}
        </button>
      </div>

      {/* Save / export status messages — announced by screen readers */}
      <div aria-live="polite" aria-atomic="true" className="space-y-1 mt-2">
        {cloudSaveMessage && (
          <p role="status" className="text-xs text-slate-500">{cloudSaveMessage}</p>
        )}
        {docxError && (
          <p role="alert" className="text-xs text-red-600">{docxError}</p>
        )}
        {pdfError && (
          <p role="alert" className="text-xs text-red-600">{pdfError}</p>
        )}
      </div>

      <div className="mt-2 flex justify-start">
        <button
          type="button"
          onClick={prevStep}
          className="min-h-[44px] w-full rounded-lg border border-slate-200 px-5 py-2.5 font-medium text-slate-600 transition-colors hover:bg-slate-50 md:w-auto"
        >
          Back
        </button>
      </div>
    </div>
  );
}


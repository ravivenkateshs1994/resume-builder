"use client";

import { useResumeStore } from "@/store/resumeStore";
import TemplatePicker from "@/components/TemplatePicker";
import ResumeRenderer from "@/components/templates/ResumeRenderer";
import { useRef, useState } from "react";

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
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resumeData.personalInfo.fullName.replace(/\s+/g, "_")}_Resume.docx`;
      a.click();
      URL.revokeObjectURL(url);
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
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resumeData.personalInfo.fullName.replace(/\s+/g, "_")}_Resume.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF export error:", error);
      alert(error instanceof Error ? error.message : "PDF export failed. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <div className="flex gap-6 min-h-0">
      {/* ── Left sidebar: template picker ── */}
      <div className="w-52 flex-shrink-0">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Templates</h3>
        <div className="overflow-y-auto max-h-[calc(100vh-220px)] pr-0.5">
          <TemplatePicker variant="sidebar" />
        </div>
      </div>

      {/* ── Right: controls + preview ── */}
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
      <div className="app-panel rounded-xl p-4 mb-6 flex items-center justify-between gap-4 flex-wrap border border-violet-100">
        <div>
          <p className="text-sm font-semibold text-slate-800">🔍 Analyze skill gaps for a specific role</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare your resume against any job description and get personalized learning resources.
          </p>
        </div>
        <a
          href="/gap-analysis"
          className="flex-shrink-0 bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
        >
          Open Gap Analyzer →
        </a>
      </div>

      {/* Export Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={exportPdf}
          disabled={exportingPdf}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          📄 {exportingPdf ? "Preparing PDF..." : "Download PDF"}
        </button>
        <button
          onClick={exportDocx}
          disabled={exportingDocx}
          className="flex items-center gap-2 bg-violet-700 hover:bg-violet-800 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          📝 {exportingDocx ? "Exporting..." : "Download DOCX"}
        </button>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={prevStep}
          className="border border-slate-200 text-slate-600 px-5 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-colors"
        >
          ← Back
        </button>
      </div>
      </div>{/* end right column */}
    </div>
  );
}

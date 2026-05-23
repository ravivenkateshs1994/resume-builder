"use client";

import { useResumeStore } from "@/store/resumeStore";
import TemplatePicker from "@/components/TemplatePicker";
import ResumeRenderer from "@/components/templates/ResumeRenderer";
import { useEffect, useRef, useState } from "react";

const BLEED_TEMPLATES = new Set([
  "modern",
  "creative",
  "executive",
  "slate",
  "terra",
  "tech",
]);

export default function PreviewStep() {
  const {
    resumeData,
    selectedTemplate,
    templateAccentColor,
    setResumeData,
    prevStep,
    setIsGenerating,
  } = useResumeStore();
  const previewScale = 0.85;

  const [tailoring, setTailoring] = useState(false);
  const [showTailorInputs, setShowTailorInputs] = useState(false);
  type PendingTailor = {
    summary: string;
    workExperience: { id: string; title: string; oldDesc: string; newDesc: string }[];
    additionalSkills: string[];
    atsScore: number | null;
    targetRole: string;
    jobDescription: string;
  };
  const [pendingTailor, setPendingTailor] = useState<PendingTailor | null>(null);
  const [targetRoleInput, setTargetRoleInput] = useState(resumeData.targetRole || "");
  const [jobDescriptionInput, setJobDescriptionInput] = useState(resumeData.jobDescription || "");
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);
  const bleedMode = BLEED_TEMPLATES.has(selectedTemplate);
  const previewRef = useRef<HTMLDivElement>(null);
  const visualExportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTargetRoleInput(resumeData.targetRole || "");
    setJobDescriptionInput(resumeData.jobDescription || "");
  }, [resumeData.targetRole, resumeData.jobDescription]);

  async function optimizeWithAts() {
    const targetRole = targetRoleInput.trim() || resumeData.targetRole || "";
    const jobDescription = jobDescriptionInput.trim() || resumeData.jobDescription || "";

    if (!jobDescription.trim()) {
      alert("Add a job description to enable ATS optimization.");
      return;
    }

    setResumeData({ targetRole, jobDescription });

    setTailoring(true);
    setIsGenerating(true);
    try {
      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeData: {
            ...resumeData,
            targetRole,
            jobDescription,
          },
          jobDescription,
        }),
      });
      const data = await res.json();

      // Build preview of changes for user confirmation
      const expChanges = resumeData.workExperience
        .map((w) => {
          const tailored = data.workExperience?.find((t: { id: string }) => t.id === w.id);
          const newDesc = tailored?.description ?? w.description;
          return { id: w.id, title: w.title || w.company || "Role", oldDesc: w.description || "", newDesc: newDesc || "" };
        })
        .filter((e) => e.oldDesc !== e.newDesc);

      setPendingTailor({
        summary: data.summary || "",
        workExperience: expChanges,
        additionalSkills: data.additionalSkills || [],
        atsScore: data.atsScore || null,
        targetRole,
        jobDescription,
      });
    } catch {
      alert("ATS optimization failed. Please try again.");
    } finally {
      setTailoring(false);
      setIsGenerating(false);
    }
  }

  function applyTailor() {
    if (!pendingTailor) return;
    const updatedExperience = resumeData.workExperience.map((w) => {
      const change = pendingTailor.workExperience.find((e) => e.id === w.id);
      return change ? { ...w, description: change.newDesc } : w;
    });
    setResumeData({
      targetRole: pendingTailor.targetRole,
      jobDescription: pendingTailor.jobDescription,
      summary: pendingTailor.summary || resumeData.summary,
      workExperience: updatedExperience,
      skills: pendingTailor.additionalSkills.length
        ? [...new Set([...resumeData.skills, ...pendingTailor.additionalSkills])]
        : resumeData.skills,
    });
    if (pendingTailor.atsScore) setAtsScore(pendingTailor.atsScore);
    setPendingTailor(null);
  }

  async function exportDocx() {
    setExportingDocx(true);
    try {
      const res = await fetch("/api/export/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData, selectedTemplate, templateAccentColor }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resumeData.personalInfo.fullName.replace(/\s+/g, "_")}_Resume.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("DOCX export failed.");
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
        Optimize your resume for ATS, then download the updated version.
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

      {/* Unified ATS optimization section */}
      <div className="app-panel rounded-xl px-4 py-3 mb-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-slate-800">✨ ATS Optimization (Optional)</p>
            <p className="text-xs text-slate-500">
              {jobDescriptionInput.trim() || resumeData.jobDescription
                ? "Your resume can now be optimized against this role's keywords and intent."
                : "Add target role and job description, then run optimization."}
            </p>
            {atsScore !== null && (
              <p className="text-xs text-green-700 font-medium mt-1">Projected ATS Score: {atsScore}%</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowTailorInputs((v) => !v)}
              className="text-xs font-semibold text-violet-700 hover:text-violet-900"
            >
              {showTailorInputs ? "Hide Details" : "Add Details"}
            </button>
          </div>
        </div>

        {showTailorInputs && (
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Target Role</label>
              <input
                value={targetRoleInput}
                onChange={(e) => setTargetRoleInput(e.target.value)}
                placeholder="e.g. Senior Product Manager"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Job Description</label>
              <textarea
                value={jobDescriptionInput}
                onChange={(e) => setJobDescriptionInput(e.target.value)}
                rows={6}
                placeholder="Paste the job description to tailor keywords, summary, and bullets."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">{jobDescriptionInput.length} characters</p>
            </div>
            <button
              onClick={optimizeWithAts}
              disabled={tailoring || !(jobDescriptionInput.trim() || resumeData.jobDescription)}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
            >
              {tailoring ? <><span className="animate-spin">⟳</span> Optimizing...</> : <>✨ Optimize Resume</>}
            </button>
          </div>
        )}
      </div>

      {/* Confirmation panel */}
      {pendingTailor && (
        <div className="app-panel rounded-xl px-4 py-4 mb-5 border-2 border-violet-300 bg-violet-50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-violet-800">Review ATS Changes Before Applying</p>
            {pendingTailor.atsScore && (
              <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                ATS Score: {pendingTailor.atsScore}%
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs max-h-72 overflow-y-auto pr-1">
            {/* Summary change */}
            {pendingTailor.summary && pendingTailor.summary !== resumeData.summary && (
              <div className="bg-white rounded-lg border border-violet-200 p-3">
                <p className="font-semibold text-slate-700 mb-1">Summary</p>
                {resumeData.summary && (
                  <p className="text-red-600 line-through mb-1 leading-relaxed">{resumeData.summary}</p>
                )}
                <p className="text-green-700 leading-relaxed">{pendingTailor.summary}</p>
              </div>
            )}

            {/* Experience changes */}
            {pendingTailor.workExperience.map((e) => (
              <div key={e.id} className="bg-white rounded-lg border border-violet-200 p-3">
                <p className="font-semibold text-slate-700 mb-1">{e.title}</p>
                <p className="text-red-600 line-through mb-1 leading-relaxed whitespace-pre-line">{e.oldDesc}</p>
                <p className="text-green-700 leading-relaxed whitespace-pre-line">{e.newDesc}</p>
              </div>
            ))}

            {/* New skills */}
            {pendingTailor.additionalSkills.filter((s) => !resumeData.skills.includes(s)).length > 0 && (
              <div className="bg-white rounded-lg border border-violet-200 p-3">
                <p className="font-semibold text-slate-700 mb-1">Skills to Add</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {pendingTailor.additionalSkills
                    .filter((s) => !resumeData.skills.includes(s))
                    .map((s) => (
                      <span key={s} className="bg-green-100 text-green-700 border border-green-300 rounded-full px-2 py-0.5 text-[11px] font-medium">+ {s}</span>
                    ))}
                </div>
              </div>
            )}

            {pendingTailor.workExperience.length === 0 && !pendingTailor.summary && pendingTailor.additionalSkills.length === 0 && (
              <p className="text-slate-500 text-center py-2">No changes detected — resume already matches the job description well.</p>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={applyTailor}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ✓ Apply Changes
            </button>
            <button
              onClick={() => setPendingTailor(null)}
              className="flex-1 border border-slate-300 text-slate-600 text-sm px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              ✕ Discard
            </button>
          </div>
        </div>
      )}

      {/* Export Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={exportPdf}
          disabled={exportingPdf}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          📄 {exportingPdf ? "Preparing..." : "Download PDF"}
        </button>
        <button
          onClick={exportDocx}
          disabled={exportingDocx}
          className="flex items-center gap-2 bg-violet-700 hover:bg-violet-800 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          📝 {exportingDocx ? "Exporting..." : "Download DOCX"}
        </button>
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

      {/* Off-screen export target — renders at full native width for capture accuracy */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: "-10000px",
          top: 0,
          width: "210mm",
          minHeight: "297mm",
          padding: bleedMode ? 0 : "12mm 12mm",
          boxSizing: "border-box",
          margin: "0 auto",
          background: "#fff",
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        <div ref={visualExportRef} style={{ background: "#fff", width: "100%", height: "100%", zoom: 1 }}>
          <ResumeRenderer data={resumeData} templateId={selectedTemplate} accentColor={templateAccentColor} />
        </div>
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

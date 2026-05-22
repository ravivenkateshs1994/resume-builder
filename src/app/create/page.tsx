"use client";

import { useResumeStore } from "@/store/resumeStore";
import { useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import StepIndicator from "@/components/StepIndicator";
import AccentColorPicker from "@/components/AccentColorPicker";
import ResumeRenderer from "@/components/templates/ResumeRenderer";
import { getDefaultTemplateAccent } from "@/lib/templateTheme";
import PersonalInfoStep from "@/components/steps/PersonalInfoStep";
import ExperienceStep from "@/components/steps/ExperienceStep";
import EducationStep from "@/components/steps/EducationStep";
import SkillsStep from "@/components/steps/SkillsStep";
import PreviewStep from "@/components/steps/PreviewStep";
import type { ResumeData, TemplateId } from "@/types/resume";

const TEMPLATE_OPTIONS: {
  id: TemplateId;
  name: string;
  accent: string;
  style: string;
  category: "simple" | "modern" | "professional" | "ats";
  tags: string[];
}[] = [
  { id: "modern", name: "Modern", accent: "bg-blue-600", style: "Balanced two-column with clean hierarchy.", category: "modern", tags: ["ATS", "Popular"] },
  { id: "classic", name: "Classic", accent: "bg-slate-700", style: "Traditional format with conservative styling.", category: "professional", tags: ["Formal", "ATS"] },
  { id: "creative", name: "Creative", accent: "bg-violet-700", style: "Bold sidebar layout for standout portfolios.", category: "modern", tags: ["Design", "Modern"] },
  { id: "minimal", name: "Minimal", accent: "bg-gray-400", style: "Minimal whitespace-focused, elegant look.", category: "simple", tags: ["Simple", "Clean"] },
  { id: "executive", name: "Executive", accent: "bg-gray-900", style: "Premium corporate style for leadership roles.", category: "professional", tags: ["Senior", "Corporate"] },
  { id: "slate", name: "Slate", accent: "bg-slate-800", style: "Dark-accent professional two-pane composition.", category: "modern", tags: ["Structured", "Modern"] },
  { id: "chronos", name: "Chronos", accent: "bg-teal-600", style: "Timeline-centric storytelling layout.", category: "modern", tags: ["Timeline", "Elegant"] },
  { id: "terra", name: "Terra", accent: "bg-amber-700", style: "Warm editorial tone with refined typography.", category: "professional", tags: ["Creative", "Warm"] },
  { id: "tech", name: "Tech", accent: "bg-cyan-600", style: "Sharp high-contrast style for tech profiles.", category: "ats", tags: ["Tech", "Bold"] },
  { id: "nova", name: "Nova", accent: "bg-blue-500", style: "Avatar header with vibrant full-width accent banner.", category: "modern", tags: ["Photo", "Modern"] },
  { id: "prism", name: "Prism", accent: "bg-teal-500", style: "Light sidebar with accent-tinted left panel.", category: "modern", tags: ["Two-Column", "Elegant"] },
  { id: "apex", name: "Apex", accent: "bg-slate-600", style: "Bold headers, grid skills — maximally ATS-safe.", category: "ats", tags: ["ATS", "Clean"] },
];

const templatePreviewData: ResumeData = {
  personalInfo: {
    fullName: "Alex Morgan",
    email: "alex.morgan@email.com",
    phone: "+1 555 112 3344",
    location: "Austin, TX",
    linkedin: "linkedin.com/in/alexmorgan",
    website: "alexmorgan.dev",
    jobTitle: "Senior Product Manager",
  },
  targetRole: "Senior Product Manager",
  jobDescription: "",
  summary:
    "Product leader with 9+ years building SaaS platforms, leading cross-functional teams, and shipping customer-centric features at scale. Strong track record across activation, retention, and monetization, with measurable business outcomes in fast-moving B2B environments.",
  workExperience: [
    {
      id: "preview-exp-1",
      company: "Nova Systems",
      title: "Product Manager",
      location: "Austin, TX",
      startDate: "Jan 2021",
      endDate: "Present",
      description:
        "<ul><li><p>Launched onboarding improvements that increased activation by 24% across 30k+ monthly users.</p></li><li><p>Partnered with engineering and design to ship 3 high-impact roadmap initiatives in under two quarters.</p></li><li><p>Introduced KPI dashboards and weekly experiment reviews, cutting decision turnaround time by 40%.</p></li></ul>",
    },
    {
      id: "preview-exp-2",
      company: "Aster Cloud",
      title: "Associate Product Manager",
      location: "Remote",
      startDate: "Jul 2018",
      endDate: "Dec 2020",
      description:
        "<ul><li><p>Owned billing and subscription workflows that improved trial-to-paid conversion by 18%.</p></li><li><p>Collaborated with support and sales to prioritize customer pain points and reduce churn.</p></li><li><p>Delivered quarterly roadmap planning with clear milestone alignment across product and engineering.</p></li></ul>",
    },
    {
      id: "preview-exp-3",
      company: "BrightForge Labs",
      title: "Business Analyst",
      location: "Dallas, TX",
      startDate: "Jun 2015",
      endDate: "Jun 2018",
      description:
        "<ul><li><p>Analyzed customer usage data to identify adoption blockers and recommend product improvements.</p></li><li><p>Built reporting models that improved forecast accuracy for quarterly planning cycles.</p></li></ul>",
    },
  ],
  education: [
    {
      id: "preview-edu-1",
      institution: "University of Texas",
      degree: "BBA",
      field: "Management Information Systems",
      startDate: "2014",
      endDate: "2018",
      gpa: "",
      honors: "",
    },
    {
      id: "preview-edu-2",
      institution: "Coursera / DeepLearning.AI",
      degree: "Professional Certificate",
      field: "AI Product Management",
      startDate: "2022",
      endDate: "2023",
      gpa: "",
      honors: "",
    },
  ],
  skills: [
    "Product Strategy",
    "Roadmapping",
    "User Research",
    "A/B Testing",
    "Data Analytics",
    "KPI Design",
    "Agile Delivery",
    "Stakeholder Management",
  ],
  certifications: [
    { id: "preview-cert-1", name: "Certified Scrum Product Owner (CSPO)", issuer: "Scrum Alliance", date: "2021" },
    { id: "preview-cert-2", name: "Google Data Analytics", issuer: "Google", date: "2020" },
  ],
};

export default function CreatePage() {
  const {
    currentStep,
    selectedTemplate,
    templateAccentColor,
    setSelectedTemplate,
    setResumeData,
    goToStep,
    reset,
  } = useResumeStore();

  // "gate" = upload/scratch choice screen, "form" = step form
  const [mode, setMode] = useState<"gate" | "form">("gate");

  const searchParams = useSearchParams();
  useEffect(() => {
    const step = searchParams.get("step");
    if (step && ["personal", "experience", "education", "skills", "preview"].includes(step)) {
      goToStep(step as Parameters<typeof goToStep>[0]);
      setMode("form");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadMsgIdx, setUploadMsgIdx] = useState(0);

  const UPLOAD_MESSAGES = [
    "Reading your resume...",
    "Identifying your experience...",
    "Extracting skills & achievements...",
    "Recognising education & certifications...",
    "Organising your work history...",
    "Almost there — putting it all together...",
  ];
  const [prefilled, setPrefilled] = useState(false);
  const [showStartChoice, setShowStartChoice] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<TemplateId | null>(null);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "simple" | "modern" | "one-column" | "with-photo" | "professional" | "ats"
  >("all");
  // Incrementing this forces step components to remount so their useState
  // initializers re-run against the freshly-populated store.
  const [uploadKey, setUploadKey] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const visibleTemplates = TEMPLATE_OPTIONS.filter((t) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "ats") return t.tags.includes("ATS") || t.category === "ats";
    if (activeFilter === "one-column") return ["classic", "minimal", "executive", "terra"].includes(t.id);
    if (activeFilter === "with-photo") return ["creative", "chronos", "slate"].includes(t.id);
    return t.category === activeFilter;
  });

  function startFreshFlow(templateToKeep?: TemplateId) {
    reset();
    if (templateToKeep) setSelectedTemplate(templateToKeep);
    goToStep("personal");
    setPrefilled(false);
    setUploadError("");
    setUploadStatus("");
    setUploadKey((k) => k + 1);
  }

  function askStartPath(templateId: TemplateId) {
    setSelectedTemplate(templateId);
    setPendingTemplate(templateId);
    setShowStartChoice(true);
  }

  /** Load PDF.js from CDN (avoids webpack bundling the 3 MB library) */
  async function loadPdfJs() {
    const PDFJS_VERSION = "3.11.174";
    type PdfItem = { str?: string; transform?: number[]; width?: number };
    type PdfViewport = { width: number; height: number };
    type PdfRenderTask = { promise: Promise<void> };
    type PdfPage = {
      getTextContent: () => Promise<{ items: PdfItem[] }>;
      getViewport: (opts: { scale: number }) => PdfViewport;
      render: (opts: { canvasContext: CanvasRenderingContext2D; viewport: PdfViewport }) => PdfRenderTask;
    };
    type PdfLib = {
      GlobalWorkerOptions: { workerSrc: string };
      getDocument: (src: { data: ArrayBuffer }) => {
        promise: Promise<{
          numPages: number;
          getPage: (n: number) => Promise<PdfPage>;
        }>;
      };
    };
    const w = window as Window & { pdfjsLib?: PdfLib };
    if (!w.pdfjsLib) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load PDF.js from CDN"));
        document.head.appendChild(script);
      });
      w.pdfjsLib!.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;
    }
    return w.pdfjsLib!;
  }

  function extractPdfLineText(items: Array<{ x: number; text: string }>): string {
    const sorted = items.sort((a, b) => a.x - b.x);
    return sorted
      .map((it, idx) => {
        if (idx === 0) return it.text;
        const prev = sorted[idx - 1];
        const gap = it.x - prev.x;
        return gap > 24 ? `  ${it.text}` : ` ${it.text}`;
      })
      .join("")
      .trim();
  }

  function buildLayoutAwarePageText(
    items: Array<{ x: number; y: number; text: string }>,
    pageWidth: number
  ): string {
    const lineBuckets = new Map<number, Array<{ x: number; text: string }>>();
    for (const item of items) {
      const key = Math.round(item.y / 3) * 3;
      const existing = lineBuckets.get(key) ?? [];
      existing.push({ x: item.x, text: item.text });
      lineBuckets.set(key, existing);
    }

    const lines = Array.from(lineBuckets.entries())
      .map(([y, lineItems]) => {
        const minX = Math.min(...lineItems.map((it) => it.x));
        return { y, minX, text: extractPdfLineText(lineItems) };
      })
      .filter((line) => line.text);

    if (!lines.length) return "";

    const starts = [...new Set(lines.map((l) => Math.round(l.minX / 8) * 8))].sort((a, b) => a - b);
    const splitThreshold = Math.max(120, pageWidth * 0.22);
    const columns: number[] = [];
    for (const start of starts) {
      const prev = columns[columns.length - 1];
      if (prev == null || Math.abs(start - prev) > splitThreshold) {
        columns.push(start);
      }
    }

    if (columns.length <= 1) {
      return lines
        .sort((a, b) => b.y - a.y)
        .map((line) => line.text)
        .join("\n");
    }

    const byColumn = new Map<number, typeof lines>();
    for (let idx = 0; idx < columns.length; idx++) byColumn.set(idx, []);

    for (const line of lines) {
      let bestIdx = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      for (let idx = 0; idx < columns.length; idx++) {
        const dist = Math.abs(line.minX - columns[idx]);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = idx;
        }
      }
      byColumn.get(bestIdx)!.push(line);
    }

    return columns
      .map((_, idx) =>
        (byColumn.get(idx) ?? [])
          .sort((a, b) => b.y - a.y)
          .map((line) => line.text)
          .join("\n")
          .trim()
      )
      .filter(Boolean)
      .join("\n\n");
  }

  /**
   * Extract text AND render page images from a PDF.
   * Images are used by Gemini vision to handle formatted/multi-column layouts.
   * Text is included as a hint for text-selectable PDFs.
   */
  async function extractPdfData(file: File): Promise<{ text: string; layoutText: string; images: string[] }> {
    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const pageTexts: string[] = [];
    const layoutTexts: string[] = [];
    const images: string[] = [];
    // Only process first 3 pages — enough for any resume
    const pagesToProcess = Math.min(pdf.numPages, 3);

    for (let i = 1; i <= pagesToProcess; i++) {
      const page = await pdf.getPage(i);

      // ── Text extraction (best-effort for text-layer PDFs) ──
      const content = await page.getTextContent();
      const lineMap = new Map<number, { x: number; text: string }[]>();
      const positionedItems: Array<{ x: number; y: number; text: string }> = [];
      for (const item of content.items) {
        const str = item.str ?? "";
        if (!str.trim()) continue;
        const rawY = item.transform?.[5] ?? 0;
        const y = Math.round(rawY / 3) * 3;
        const x = item.transform?.[4] ?? 0;
        const existing = lineMap.get(y) ?? [];
        existing.push({ x, text: str });
        lineMap.set(y, existing);
        positionedItems.push({ x, y: rawY, text: str });
      }
      const sortedLines = Array.from(lineMap.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([, items]) =>
          items
            .sort((a, b) => a.x - b.x) // left-to-right within each line
            .map((it) => it.text)
            .join(" ")
            .trim()
        )
        .filter(Boolean);
      pageTexts.push(sortedLines.join("\n"));

      const viewport = page.getViewport({ scale: 1.8 });
      const layoutText = buildLayoutAwarePageText(positionedItems, viewport.width);
      layoutTexts.push(layoutText || sortedLines.join("\n"));

      // ── Render page to canvas image for vision parsing ──
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport }).promise;
        images.push(canvas.toDataURL("image/jpeg", 0.82));
      }
    }

    return { text: pageTexts.join("\n"), layoutText: layoutTexts.join("\n\n"), images };
  }

  async function handleFileUpload(file: File) {
    const templateToKeep = pendingTemplate || selectedTemplate;
    startFreshFlow(templateToKeep);
    setUploading(true);
    setUploadError("");
    setUploadMsgIdx(0);
    const msgInterval = setInterval(() => {
      setUploadMsgIdx((i) => (i + 1) % UPLOAD_MESSAGES.length);
    }, 2200);
    const isPdf = file.type === "application/pdf";

    try {
      let res: Response;

      if (isPdf) {
        const { text, layoutText, images } = await extractPdfData(file);
        res = await fetch("/api/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, layoutText, images }),
        });
      } else {
        // DOCX — send file to server, mammoth extracts server-side
        const form = new FormData();
        form.append("resume", file);
        res = await fetch("/api/parse", { method: "POST", body: form });
      }

      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Upload failed.");
        return;
      }
      setResumeData(data);
      setPrefilled(true);
      setMode("form");
    } catch (err) {
      console.error(err);
      setUploadError("Failed to read the file. Please try again.");
    } finally {
      clearInterval(msgInterval);
      setUploading(false);
      setUploadStatus("");
      setPendingTemplate(null);
    }
  }

  function renderStep() {
    switch (currentStep) {
      case "personal":   return <PersonalInfoStep />;
      case "experience": return <ExperienceStep />;
      case "education":  return <EducationStep />;
      case "skills":     return <SkillsStep />;
      case "preview":    return <PreviewStep />;
      default:           return <PersonalInfoStep />;
    }
  }

  // ── Hidden file input (shared between gate + form) ──────────────────────────
  const fileInput = (
    <input
      ref={fileRef}
      type="file"
      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
        e.target.value = "";
      }}
    />
  );

  // ── Gate screen ──────────────────────────────────────────────────────────────
  if (mode === "gate") {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Top nav */}
        <div className="border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
            <span className="text-xl">📝</span>
            <span className="font-bold">ResumeAI</span>
          </Link>
          <button
            type="button"
            onClick={() => setMode("form")}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700"
          >
            Choose Later
          </button>
        </div>

        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Resume templates</h1>
              <p className="text-slate-500 mt-1">Simple to use and ready in minutes. Pick one to continue.</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-900 font-semibold">1 Choose template</span>
              <span className="text-slate-400">2 Enter details</span>
              <span className="text-slate-400">3 Download resume</span>
            </div>
          </div>

          <div className="border-b border-slate-200 mb-6">
            <div className="flex items-center gap-4 overflow-x-auto pb-0.5">
              {[
                { key: "all", label: "All Templates" },
                { key: "simple", label: "Simple" },
                { key: "modern", label: "Modern" },
                { key: "one-column", label: "One column" },
                { key: "with-photo", label: "With photo" },
                { key: "professional", label: "Professional" },
                { key: "ats", label: "ATS" },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() =>
                    setActiveFilter(
                      f.key as
                        | "all"
                        | "simple"
                        | "modern"
                        | "one-column"
                        | "with-photo"
                        | "professional"
                        | "ats"
                    )
                  }
                  className={`whitespace-nowrap px-3 py-2 text-lg font-semibold border-b-2 transition-colors ${
                    activeFilter === f.key
                      ? "text-violet-600 border-violet-600"
                      : "text-slate-500 border-transparent hover:text-slate-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mb-4">
            <button
              type="button"
              onClick={() => askStartPath(selectedTemplate)}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm px-4 py-2 rounded-lg font-semibold transition-all shadow-sm"
            >
              Use selected template
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {visibleTemplates.map((t) => (
              <article key={t.id} className={`border border-slate-200 rounded-2xl p-3 bg-[#f3f6fb] shadow-sm ${selectedTemplate === t.id ? "ring-2 ring-violet-500 border-violet-300" : ""}`}>
                <button
                  type="button"
                  onClick={() => setSelectedTemplate(t.id)}
                  className="w-full text-left"
                >
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white mb-3">
                  <div className="h-1.5" style={{ backgroundColor: selectedTemplate === t.id ? templateAccentColor : getDefaultTemplateAccent(t.id) }} />
                  <div className="h-[500px] overflow-hidden bg-white pointer-events-none select-none">
                    <div style={{ zoom: 0.39 }}>
                    <ResumeRenderer data={templatePreviewData} templateId={t.id} accentColor={selectedTemplate === t.id ? templateAccentColor : getDefaultTemplateAccent(t.id)} />
                    </div>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{t.name}</h3>
                    <p className="text-xs text-slate-600">{t.style}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {t.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                </button>

                <div className="flex items-center justify-between mb-2">
                  <AccentColorPicker templateId={t.id} />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    askStartPath(t.id);
                  }}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm px-4 py-2 rounded-lg font-semibold transition-all"
                >
                  Use this template
                </button>
              </article>
            ))}
          </div>

          {uploading && (
            <div className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center px-4">
              <div className="bg-white rounded-xl shadow-xl border border-slate-200 px-6 py-5 flex flex-col items-center gap-3 min-w-[220px]">
                <span className="text-2xl animate-spin inline-block">⟳</span>
                <p className="text-sm font-medium text-slate-700 text-center transition-all">
                  {UPLOAD_MESSAGES[uploadMsgIdx]}
                </p>
              </div>
            </div>
          )}

          {uploadError && <p className="mt-4 text-sm text-red-500">{uploadError}</p>}

          {showStartChoice && (
            <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center px-4">
              <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-5">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Template selected</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Great choice. Do you want to import an existing resume or start fresh with this template?
                </p>

                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (pendingTemplate) setSelectedTemplate(pendingTemplate);
                      setShowStartChoice(false);
                      fileRef.current?.click();
                    }}
                    className="w-full border border-slate-300 hover:border-slate-400 text-slate-700 text-sm px-4 py-2.5 rounded-lg font-semibold"
                  >
                    Import Resume
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      startFreshFlow(pendingTemplate || selectedTemplate);
                      setShowStartChoice(false);
                      setMode("form");
                    }}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm px-4 py-2.5 rounded-lg font-semibold transition-all"
                  >
                    Start Afresh
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowStartChoice(false);
                      setPendingTemplate(null);
                    }}
                    className="w-full text-slate-500 hover:text-slate-700 text-sm px-4 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {fileInput}
      </div>
    );
  }

  // ── Form screen ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      {/* Top nav */}
      <div className="border-b border-slate-200/70 bg-white/80 backdrop-blur px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">R</div>
          <span className="font-bold text-slate-800">ResumeAI</span>
        </Link>
        <button
          onClick={() => {
            startFreshFlow();
            setMode("gate");
          }}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          ← Start over
        </button>
      </div>

      {/* Main form — always wide, left sidebar nav + right content */}
      <div className="max-w-7xl mx-auto px-4 py-10 flex gap-8">

        {/* ── Left sidebar: vertical step navigator ── */}
        <div className="w-44 flex-shrink-0 pt-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 px-3">Steps</p>
          <StepIndicator variant="vertical" />
        </div>

        {/* ── Right: form content ── */}
        <div className="flex-1 min-w-0">
          {/* ── Prefill banner (shown only after upload) ── */}
          {prefilled && (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm">
              <div className="flex items-center gap-2 text-green-700">
                <span>✓</span>
                <span>Resume imported — fields pre-filled. Review and edit below.</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    startFreshFlow();
                    fileRef.current?.click();
                  }}
                  className="text-green-700 underline underline-offset-2 hover:text-green-900 whitespace-nowrap"
                >
                  Upload different file
                </button>
                <button
                  onClick={() => setPrefilled(false)}
                  className="text-green-500 hover:text-green-700"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {fileInput}

          <div key={uploadKey} className={currentStep === "preview" ? "" : "app-panel rounded-2xl p-6 sm:p-8"}>
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useResumeStore } from "@/store/resumeStore";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import StepIndicator from "@/components/StepIndicator";
import { TEMPLATE_CATALOG as TEMPLATE_OPTIONS, TemplateGalleryCard } from "@/components/templates/templateGallery";
import type { TemplateCatalogItem } from "@/components/templates/templateGallery";
import type { TemplateId } from "@/types/resume";

const StepShell = ({ title }: { title: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="animate-pulse space-y-4">
      <div>
        <div className="h-3 w-28 rounded-full bg-slate-200" />
        <div className="mt-3 h-8 w-72 max-w-full rounded-xl bg-slate-200" />
        <div className="mt-2 h-4 w-52 max-w-full rounded-full bg-slate-100" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="h-4 w-24 rounded-full bg-slate-200" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded-full bg-slate-200" />
            <div className="h-3 w-5/6 rounded-full bg-slate-200" />
            <div className="h-3 w-2/3 rounded-full bg-slate-200" />
          </div>
        </div>
        <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="h-4 w-24 rounded-full bg-slate-200" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded-full bg-slate-200" />
            <div className="h-3 w-5/6 rounded-full bg-slate-200" />
            <div className="h-3 w-2/3 rounded-full bg-slate-200" />
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-500">
        Loading {title}...
      </div>
    </div>
  </div>
);

const PersonalInfoStep = dynamic(() => import("@/components/steps/PersonalInfoStep"), {
  ssr: false,
  loading: () => <StepShell title="Personal information" />,
});

const ExperienceStep = dynamic(() => import("@/components/steps/ExperienceStep"), {
  ssr: false,
  loading: () => <StepShell title="Experience" />,
});

const EducationStep = dynamic(() => import("@/components/steps/EducationStep"), {
  ssr: false,
  loading: () => <StepShell title="Education" />,
});

const SkillsStep = dynamic(() => import("@/components/steps/SkillsStep"), {
  ssr: false,
  loading: () => <StepShell title="Skills" />,
});

const PreviewStep = dynamic(() => import("@/components/steps/PreviewStep"), {
  ssr: false,
  loading: () => <StepShell title="Preview" />,
});

function AppHeader() {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            R
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">ResumeAI</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-slate-600 font-medium">
          <Link href="/" className="hover:text-slate-900 transition-colors">
            Home
          </Link>
          <Link href="/gap-analysis" className="hover:text-slate-900 transition-colors">
            Gap Analyzer
          </Link>
          <Link href="/create" className="hover:text-slate-900 transition-colors">
            Builder
          </Link>
        </nav>
      </div>
    </header>
  );
}

const flowStages = [
  { number: "01", title: "Choose template" },
  { number: "02", title: "Enter details" },
  { number: "03", title: "Download resume" },
] as const;

function FlowStrip({ activeStep }: { activeStep: number }) {
  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
      <div className="rounded-full border border-slate-200 bg-white/85 px-3 py-2 shadow-sm backdrop-blur">
        <div className="flex items-center justify-center gap-2 overflow-x-auto whitespace-nowrap">
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-600">
            Template flow
          </span>
          {flowStages.map((step, index) => (
            <div
              key={step.number}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                index === activeStep ? "bg-violet-50 text-slate-900" : "text-slate-500"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  index === activeStep
                    ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-sm shadow-violet-200"
                    : "border border-slate-200 bg-white text-slate-500"
                }`}
              >
                {step.number}
              </span>
              <span>{step.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


function CreatePageContent() {
  const {
    currentStep,
    selectedTemplate,
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

  const visibleTemplates: TemplateCatalogItem[] = TEMPLATE_OPTIONS.filter((t: TemplateCatalogItem) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "ats") return t.tags.includes("ATS") || t.category === "ats";
    if (activeFilter === "one-column") return ["classic", "minimal", "executive", "terra"].includes(t.id);
    if (activeFilter === "with-photo") return ["creative", "chronos", "slate", "nova", "prism"].includes(t.id);
    return t.category === activeFilter;
  });

  function startFreshFlow(templateToKeep?: TemplateId) {
    reset();
    if (templateToKeep) setSelectedTemplate(templateToKeep);
    goToStep("personal");
    setPrefilled(false);
    setUploadError("");
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
      <div className="min-h-screen bg-[#f8f9fc] flex flex-col">
        <AppHeader />

        <FlowStrip activeStep={0} />

        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 pt-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setMode("form")}
              className="border-2 border-slate-200 bg-white hover:border-slate-300 text-slate-700 px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              Choose Later
            </button>
          </div>
        </div>

        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {visibleTemplates.map((t) => (
              <TemplateGalleryCard
                key={t.id}
                template={t}
                selected={selectedTemplate === t.id}
                onSelect={() => askStartPath(t.id)}
              />
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
    <div className="min-h-screen bg-[#f8f9fc]">
      <AppHeader />

      <FlowStrip activeStep={currentStep === "preview" ? 2 : 1} />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white/80 backdrop-blur px-4 py-3 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Builder workspace</p>
            <p className="text-sm text-slate-600 mt-0.5">Keep editing, or reset and return to template selection.</p>
          </div>
          <button
            onClick={() => {
              startFreshFlow();
              setMode("gate");
            }}
            className="border-2 border-slate-200 bg-white hover:border-slate-300 text-slate-700 px-5 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap"
          >
            Start over
          </button>
        </div>
      </div>

      {/* Main form — always wide, left sidebar nav + right content */}
      <div className="max-w-7xl mx-auto px-4 py-10 flex gap-8">

        {/* ── Left sidebar: vertical step navigator ── */}
        <div className="w-44 flex-shrink-0 pt-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 px-3">Steps</p>
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

export default function CreatePage() {
  return (
    <Suspense fallback={null}>
      <CreatePageContent />
    </Suspense>
  );
}

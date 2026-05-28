"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useResumeStore } from "@/store/resumeStore";
import { useSearchParams } from "next/navigation";
import StepIndicator from "@/components/StepIndicator";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  TEMPLATE_CATALOG as TEMPLATE_OPTIONS,
  TemplateGalleryCard,
  TemplatePreviewCard,
} from "@/components/templates/templateGallery";
import type { TemplateCatalogItem } from "@/components/templates/templateGallery";
import type { TemplateId } from "@/types/resume";
import { trackEvent } from "@/lib/analytics";
import { isPremiumTemplatesEnabledClient } from "@/lib/featureFlags";
import type { CareerLevel, RoleCategory, TemplateTierFilter } from "@/lib/templateCatalog";

const StepShell = ({ title }: { title: string }) => (
  <div className="max-w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
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

const flowStages = [
  { number: "01", title: "Template" },
  { number: "02", title: "Fill Details" },
  { number: "03", title: "Final Preview" }
];

function FlowStrip({ activeStep }: { activeStep: number }) {
  // FlowStrip only displays the progress stages; store actions not required here

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6">
      <div className="rounded-2xl border border-slate-200/90 bg-white/90 px-3 py-2 shadow-[0_14px_35px_-24px_rgba(15,23,42,0.35)] backdrop-blur">
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-600">Template flow</span>
        <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-center">
          {flowStages.map((step, index) => {
            const isActive = index === activeStep;
            return (
              <div
                key={step.number}
                className={
                  isActive
                    ? "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors bg-indigo-50 text-slate-900"
                    : "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors text-slate-500"
                }
              >
                <span
                  className={
                    isActive
                      ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-sm shadow-indigo-200"
                      : "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold border border-slate-200 bg-white text-slate-500"
                  }
                >
                  {step.number}
                </span>
                <span>{step.title}</span>
              </div>
            );
          })}
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
  const { resumeHistory } = useResumeStore();
  const { uploadedResume, setUploadedResume } = useResumeStore();

  // "gate" = upload/scratch choice screen, "form" = step form
  const [mode, setMode] = useState<"gate" | "form">("gate");

  const searchParams = useSearchParams();
  // Derive the step query string so the effect depends on a primitive value
  const stepQuery = searchParams?.get("step") ?? null;
  // Use a ref for prefilled so the effect can read it without being a dep
  const prefilledRef = useRef(false);
  const [prefilled, setPrefilled] = useState(false);
  // Separate banner visibility from the `prefilled` flag so we can hide the
  // banner after a short timeout while keeping the form in a prefilled state
  const [showPrefillBanner, setShowPrefillBanner] = useState(false);
  useEffect(() => {
    if (!showPrefillBanner) return;
    const t = setTimeout(() => setShowPrefillBanner(false), 3000);
    return () => clearTimeout(t);
  }, [showPrefillBanner]);

  useEffect(() => {
    if (stepQuery && ["personal", "experience", "education", "skills", "preview"].includes(stepQuery)) {
      // If the user brought an uploaded resume from the gap-analysis flow, apply it into the main resume data so the form pre-fills.
      if (uploadedResume && !prefilledRef.current) {
        setResumeData(uploadedResume.resumeData);
        setUploadedResume(null);
        prefilledRef.current = true;
        setPrefilled(true);
        setShowPrefillBanner(true);
      }
      goToStep(stepQuery as Parameters<typeof goToStep>[0]);
      setMode("form");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepQuery]);

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
  const [showStartChoice, setShowStartChoice] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<TemplateId | null>(null);
  const [activeTierFilter, setActiveTierFilter] = useState<TemplateTierFilter>("all");
  const [activeRoleCategory, setActiveRoleCategory] = useState<RoleCategory>("all");
  const [activeLevelCategory, setActiveLevelCategory] = useState<CareerLevel>("all");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "simple" | "modern" | "one-column" | "with-photo" | "professional" | "ats"
  >("all");
  const [templates, setTemplates] = useState<TemplateCatalogItem[]>(TEMPLATE_OPTIONS);
  const [recommendedTemplateIds, setRecommendedTemplateIds] = useState<TemplateId[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateCatalogItem | null>(null);
  const premiumEnabled = isPremiumTemplatesEnabledClient();
  const trackedViews = useRef<Set<string>>(new Set());
  // Incrementing this forces step components to remount so their useState
  // initializers re-run against the freshly-populated store.
  const [uploadKey, setUploadKey] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTemplates() {
      try {
        const res = await fetch("/api/templates", { cache: "no-store" });
        if (!res.ok) return;
        const payload = await res.json();
        if (!cancelled && Array.isArray(payload.templates)) {
          setTemplates(payload.templates as TemplateCatalogItem[]);
        }
      } catch {
        // Fail open with local fallback catalog.
      }
    }

    async function loadRecommendations() {
      try {
        const jdId = searchParams?.get("jdId") || "default";
        const res = await fetch(`/api/templates/recommend?jdId=${encodeURIComponent(jdId)}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const payload = await res.json();
        if (!cancelled && Array.isArray(payload.templateIds)) {
          setRecommendedTemplateIds(payload.templateIds as TemplateId[]);
        }
      } catch {
        // Keep recommendations optional.
      }
    }

    void loadTemplates();
    void loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const visibleTemplates = useMemo(() => {
    return templates.filter((t) => {
      if (activeFilter !== "all") {
        if (activeFilter === "ats" && !(t.tags.some((tag: string) => tag.includes("ATS")) || t.category === "ats")) {
          return false;
        }
        if (activeFilter === "one-column" && !["classic", "minimal", "executive", "terra"].includes(t.id)) {
          return false;
        }
        if (activeFilter === "with-photo" && !["creative", "chronos", "slate", "nova", "prism"].includes(t.id)) {
          return false;
        }
        if (!["ats", "one-column", "with-photo"].includes(activeFilter) && t.category !== activeFilter) {
          return false;
        }
      }

      if (activeTierFilter === "free" && t.isPremium) return false;
      if (activeTierFilter === "premium" && !t.isPremium) return false;
      if (activeTierFilter === "recommended" && !recommendedTemplateIds.includes(t.id)) return false;
      if (activeRoleCategory !== "all" && t.roleCategory !== activeRoleCategory) return false;
      if (activeLevelCategory !== "all" && t.levelCategory !== activeLevelCategory) return false;
      if (!premiumEnabled && t.isPremium) return false;

      return true;
    });
  }, [
    activeFilter,
    activeTierFilter,
    activeRoleCategory,
    activeLevelCategory,
    premiumEnabled,
    recommendedTemplateIds,
    templates,
  ]);

  const freeTemplates = visibleTemplates.filter((template) => !template.isPremium);
  const premiumTemplates = visibleTemplates.filter((template) => template.isPremium);
  useEffect(() => {
    visibleTemplates.forEach((template) => {
      if (trackedViews.current.has(template.id)) return;
      trackedViews.current.add(template.id);
      trackEvent("template_view", {
        templateId: template.id,
        isPremium: template.isPremium,
        priceModel: template.priceModel,
      });
    });
  }, [visibleTemplates]);

  function startFreshFlow(templateToKeep?: TemplateId) {
    reset();
    if (templateToKeep) setSelectedTemplate(templateToKeep);
    goToStep("personal");
    setPrefilled(false);
    setUploadError("");
    setUploadKey((k) => k + 1);
  }

  async function persistTemplateSelection(templateId: TemplateId) {
    try {
      await fetch("/api/user/templates/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
    } catch {
      // Selection already persists in local state; API persistence is best-effort.
    }
  }

  function askStartPath(templateId: TemplateId) {
    setSelectedTemplate(templateId);
    setPendingTemplate(templateId);
    setShowStartChoice(true);
    void persistTemplateSelection(templateId);
    const template = templates.find((item) => item.id === templateId);
    trackEvent("template_select", {
      templateId,
      isPremium: template?.isPremium ?? false,
      priceModel: template?.priceModel ?? "free",
    });
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
      setShowPrefillBanner(true);
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
      id="resume-upload-input"
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
      <div className="crp-shell flex min-h-screen max-w-full flex-col overflow-x-hidden text-sm md:text-base">
        <SiteHeader />

        <FlowStrip activeStep={0} />

        {resumeHistory.length > 0 && (
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 mt-3">
            <div className="flex items-center justify-end">
              <label className="sr-only" htmlFor="saved-resume-select">Load saved resume</label>
              <select
                id="saved-resume-select"
                className="text-sm rounded-md border border-slate-200 bg-white py-2 px-3"
                defaultValue=""
                onChange={(e) => {
                  const id = e.target.value;
                  if (!id) return;
                  const rec = resumeHistory.find((r) => r.id === id);
                  if (!rec) return;
                  setResumeData(rec.resumeSnapshot);
                  // switch into form mode and navigate to first form step
                  setMode("form");
                  goToStep("personal");
                  setPrefilled(true);
                  setShowPrefillBanner(true);
                }}
              >
                <option value="">Load saved resume...</option>
                {resumeHistory.map((r) => (
                  <option key={r.id} value={r.id}>{`${r.title} — ${new Date(r.createdAt).toLocaleDateString()}`}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6">
          <div className="crp-card crp-module-accent crp-soft-radial relative max-w-full overflow-hidden p-4 md:p-6">
            <div className="pointer-events-none absolute -right-10 -top-14 h-32 w-32 rounded-full bg-indigo-100/70 blur-2xl" />
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <span className="crp-badge">Template Selection</span>
                <h1 className="crp-section-title mt-3 text-[28px] leading-tight md:text-[36px]">Choose Your Resume Template</h1>
                <p className="crp-section-copy mt-2 max-w-3xl break-words text-sm leading-relaxed md:text-base">
                  Select a professional ATS-friendly design for your tailored resume.
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-200/80 pt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Template Studio</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  { key: "recommended", label: "Recommended" },
                  { key: "all", label: "All" },
                  { key: "free", label: "Free" },
                  ...(premiumEnabled ? [{ key: "premium", label: "Premium" }] : []),
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setActiveTierFilter(f.key as TemplateTierFilter)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      activeTierFilter === f.key
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:gap-4">
                <div className="flex flex-wrap items-center gap-2">
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
                      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        activeFilter === f.key
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <select
                  value={activeRoleCategory}
                  onChange={(event) => setActiveRoleCategory(event.target.value as RoleCategory)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 md:w-auto"
                  aria-label="Filter by role category"
                >
                  <option value="all">All role categories</option>
                  <option value="software">Software</option>
                  <option value="design">Design</option>
                  <option value="product">Product</option>
                  <option value="operations">Operations</option>
                  <option value="leadership">Leadership</option>
                </select>

                <select
                  value={activeLevelCategory}
                  onChange={(event) => setActiveLevelCategory(event.target.value as CareerLevel)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 md:w-auto"
                  aria-label="Filter by level category"
                >
                  <option value="all">All levels</option>
                  <option value="entry">Entry</option>
                  <option value="mid">Mid</option>
                  <option value="senior">Senior</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6">
          <div className="flex justify-start sm:justify-end">
            <button
              type="button"
              onClick={() => setMode("form")}
              className="crp-btn-secondary min-h-[44px] w-full px-5 py-2 text-sm shadow-sm sm:w-auto"
            >
              Choose Later
            </button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6">

          <div className="mb-3 mt-2 flex items-center justify-between gap-3">
            <h3 className="text-[22px] font-bold tracking-tight text-slate-900 md:text-[30px]">All Templates</h3>
          </div>

          {!!freeTemplates.length && (
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-slate-700">Free Templates</h3>
              <div className="grid grid-cols-1 gap-y-5 gap-x-6 md:grid-cols-2 xl:grid-cols-3">
                {freeTemplates.map((t) => (
                  <div key={t.id} className="relative">
                    <TemplateGalleryCard
                      template={t}
                      isSelected={selectedTemplate === t.id}
                      onSelect={() => askStartPath(t.id)}
                      onPreview={() => {
                        setPreviewTemplate(t);
                        trackEvent("template_preview", {
                          templateId: t.id,
                          isPremium: t.isPremium,
                          priceModel: t.priceModel,
                        });
                      }}
                      isPremium={false}
                      atsScore={t.atsScore ?? undefined}
                      recommendedFor={t.recommendedFor}
                      isRecommended={recommendedTemplateIds.includes(t.id)}
                      matchScore={t.atsScore ?? undefined}
                      recommendationReason={
                        t.recommendedFor?.length
                          ? `AI recommendation: aligns with ${t.recommendedFor.slice(0, 2).join(" and ")} roles while maintaining ATS-friendly structure.`
                          : "AI recommendation: strong role alignment, ATS readability, and recruiter-preferred structure."
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {premiumEnabled && (
            <div className="mt-8">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-slate-700">Premium Templates</h3>
              <div className="grid grid-cols-1 gap-y-5 gap-x-6 md:grid-cols-2 xl:grid-cols-3">
                {premiumTemplates.map((t) => (
                  <TemplateGalleryCard
                    key={t.id}
                    template={t}
                    isSelected={selectedTemplate === t.id}
                    onSelect={() => askStartPath(t.id)}
                    onPreview={() => {
                      setPreviewTemplate(t);
                      trackEvent("template_preview", {
                        templateId: t.id,
                        isPremium: t.isPremium,
                        priceModel: t.priceModel,
                      });
                    }}
                    isPremium
                    atsScore={t.atsScore ?? undefined}
                    recommendedFor={t.recommendedFor}
                    isRecommended={recommendedTemplateIds.includes(t.id)}
                    matchScore={t.atsScore ?? undefined}
                    recommendationReason={
                      t.recommendedFor?.length
                        ? `AI recommendation: aligns with ${t.recommendedFor.slice(0, 2).join(" and ")} roles while maintaining ATS-friendly structure.`
                        : "AI recommendation: strong role alignment, ATS readability, and recruiter-preferred structure."
                    }
                    badgeType={t.premiumBadgeType ?? "Premium"}
                    locked={false}
                  />
                ))}
              </div>
            </div>
          )}

          {visibleTemplates.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
              No templates match your current filters.
            </div>
          )}

          {!!visibleTemplates.length && (
            <div className="mt-6 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 to-cyan-50/65 px-4 py-3 text-sm text-slate-700">
              <p className="font-semibold text-indigo-700">All templates are ATS-optimized and recruiter-approved.</p>
              <p className="mt-0.5 text-xs text-slate-600">You can change your template anytime. Your content remains safe.</p>
            </div>
          )}

          {uploading && (
            <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-sm">
              <div className="flex w-[calc(100vw-32px)] max-w-sm flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-5 shadow-xl md:px-6">
                <span className="text-2xl animate-spin inline-block">⟳</span>
                <p className="text-sm font-medium text-slate-700 text-center transition-all">
                  {UPLOAD_MESSAGES[uploadMsgIdx]}
                </p>
              </div>
            </div>
          )}

          {uploadError && <p className="mt-4 text-sm text-red-500">{uploadError}</p>}

          {showStartChoice && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
              <div className="crp-module-accent crp-soft-radial w-[calc(100vw-32px)] max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl md:p-5">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Template selected</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Great choice. Do you want to import an existing resume or start fresh with this template?
                </p>

                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      trackEvent("template_apply_attempt", { action: "import_resume", templateId: pendingTemplate || selectedTemplate });
                      if (pendingTemplate) setSelectedTemplate(pendingTemplate);
                      setShowStartChoice(false);
                      fileRef.current?.click();
                    }}
                    className="crp-btn-secondary min-h-[44px] w-full px-4 py-2.5 text-sm"
                  >
                    Import Resume
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      trackEvent("template_apply_attempt", { action: "start_afresh", templateId: pendingTemplate || selectedTemplate });
                      startFreshFlow(pendingTemplate || selectedTemplate);
                      setShowStartChoice(false);
                      setMode("form");
                    }}
                    className="crp-btn-primary min-h-[44px] w-full px-4 py-2.5 text-sm"
                  >
                    Start Afresh
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowStartChoice(false);
                      setPendingTemplate(null);
                    }}
                    className="min-h-[44px] w-full px-4 py-2 text-sm text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {previewTemplate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm">
              <div className="max-h-full w-[calc(100vw-32px)] max-w-5xl overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl md:p-5">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_1fr]">
                  <div className="rounded-2xl border border-slate-200 bg-white p-2">
                    <TemplatePreviewCard template={previewTemplate} />
                  </div>
                  <div className="crp-card-soft crp-glass crp-module-accent p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-[22px] font-bold tracking-tight text-slate-900 md:text-[30px]">{previewTemplate.name}</h3>
                      {previewTemplate.isPremium && <span className="crp-premium-badge">Premium</span>}
                    </div>
                    <p className="mt-1 break-words text-sm text-slate-600 md:text-base">{previewTemplate.description}</p>

                    {previewTemplate.atsScore != null ? (
                      <div className="mt-3 crp-score-card p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Template ATS Confidence</p>
                        <div className="mt-1.5 flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-700">ATS Score</p>
                          <span className="text-lg font-bold text-emerald-700">{previewTemplate.atsScore}</span>
                        </div>
                        <div className="mt-2 crp-score-meter">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                            style={{ width: `${Math.min(100, Math.max(0, previewTemplate.atsScore))}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">No template selected. Please choose one.</p>
                    )}

                    <div className="mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Strengths</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {previewTemplate.tags.map((tag: string) => (
                          <span key={tag} className="rounded-full bg-white/90 px-2 py-0.5 text-xs text-slate-700 border border-slate-200">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recommended Industries</p>
                      <p className="mt-1 text-sm text-slate-700">{previewTemplate.recommendedIndustries.join(", ")}</p>
                    </div>

                    <div className="mt-4 flex flex-col gap-2 md:flex-row">
                      <button
                        type="button"
                        className="crp-btn-primary min-h-[44px] w-full px-4 py-2 text-sm md:w-auto"
                        onClick={() => {
                          askStartPath(previewTemplate.id);
                          setPreviewTemplate(null);
                        }}
                      >
                        Use This Template
                      </button>
                      <button
                        type="button"
                        className="crp-btn-secondary min-h-[44px] w-full px-4 py-2 text-sm md:w-auto"
                        onClick={() => setPreviewTemplate(null)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {fileInput}

        <SiteFooter />
      </div>
    );
  }

  // ── Form screen ──────────────────────────────────────────────────────────────
  return (
    <div className="crp-shell min-h-screen max-w-full overflow-x-hidden text-sm md:text-base">
      <SiteHeader />

      <FlowStrip activeStep={currentStep === "preview" ? 2 : 1} />

      <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6">
        <div className="crp-card crp-module-accent crp-soft-radial p-4 md:p-6">
          <span className="crp-badge">Resume Tailoring</span>
          <h1 className="crp-section-title mt-3 text-[28px] leading-tight md:text-[36px]">Resume Tailoring</h1>
          <p className="crp-section-copy mt-2 max-w-3xl break-words text-sm leading-relaxed md:text-base">
            Upload your resume and paste a job description to receive targeted improvements.
          </p>
        </div>
      </div>

      {/* Steps (centered) and upload CTA */}
      <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <StepIndicator />

          {!prefilled && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => document.getElementById("resume-upload-input")?.click()}
                disabled={uploading}
                aria-busy={uploading}
                className={`w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-lg font-semibold text-white shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-200 ${
                  uploading ? "opacity-90 cursor-wait" : "hover:opacity-95"
                }`}
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    <span>{UPLOAD_MESSAGES[uploadMsgIdx] ?? "Reading your resume..."}</span>
                  </span>
                ) : (
                  "Upload resume"
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main form — always wide, left sidebar nav + right content */}
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:py-10 lg:flex-row lg:gap-8">

        {/* ── Left sidebar: vertical step navigator ── */}
        <div className="lg:w-44 lg:flex-shrink-0 lg:pt-1">
          <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 lg:mb-3 lg:px-3">Steps</p>
          <div className="hidden">
            <StepIndicator />
          </div>
          <div className="hidden lg:block">
            <StepIndicator variant="vertical" />
          </div>
        </div>

        {/* ── Right: form content ── */}
        <div className="flex-1 min-w-0">
          {/* ── Prefill banner (shown only after upload) ── */}
          {showPrefillBanner && (
            <div className="relative mb-6 rounded-xl border border-green-200 bg-green-50/95 p-4 text-sm">
              <button
                onClick={() => setShowPrefillBanner(false)}
                aria-label="Dismiss"
                className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-md text-green-700 hover:bg-green-100"
              >
                ✕
              </button>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-700">✓</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-800">Resume imported — fields pre-filled.</p>
                  <p className="mt-1 text-sm text-green-700">Review and edit below.</p>
                </div>
              </div>
            </div>
          )}

          {fileInput}

          <div key={uploadKey} className={currentStep === "preview" ? "max-w-full overflow-x-hidden" : "app-panel max-w-full overflow-x-hidden rounded-2xl p-4 md:p-6 lg:p-8"}>
            {renderStep()}
          </div>
        </div>
      </div>

      {/* Roadmap / Coming Soon section removed per design — kept page focused on resume creation */}
      <SiteFooter />
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

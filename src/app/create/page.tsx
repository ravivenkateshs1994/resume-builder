"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { LayoutTemplate, Wand2 } from "lucide-react";
import { useResumeStore } from "@/store/resumeStore";
import { useSearchParams } from "next/navigation";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import StepIndicator from "@/components/StepIndicator";
import AccentColorPicker from "@/components/AccentColorPicker";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  TEMPLATE_CATALOG as TEMPLATE_OPTIONS,
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

const stepDetails = {
  personal: {
    title: "Personal foundations",
    helper: "Set your contact details and resume basics before expanding the rest of the document.",
  },
  experience: {
    title: "Experience editor",
    helper: "Strengthen impact statements so your strongest work reads clearly and credibly.",
  },
  education: {
    title: "Education and credentials",
    helper: "Add academic and credential details that support your professional story.",
  },
  skills: {
    title: "Skill alignment",
    helper: "Surface the right keywords, tools, and capabilities for ATS and recruiters.",
  },
  preview: {
    title: "Review and export",
    helper: "Check readiness, polish weak areas, and export with confidence.",
  },
} as const;

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
    resumeData,
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
  const [focusedTemplateId, setFocusedTemplateId] = useState<TemplateId | null>(null);
  const premiumEnabled = isPremiumTemplatesEnabledClient();
  const trackedViews = useRef<Set<string>>(new Set());
  const previewPanelRef = useRef<HTMLDivElement>(null);
  const shouldScrollToPreviewRef = useRef(false);
  const [previewPulse, setPreviewPulse] = useState(false);
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
  const orderedTemplates = useMemo(() => [...freeTemplates, ...premiumTemplates], [freeTemplates, premiumTemplates]);
  const currentStepMeta = stepDetails[currentStep];
  const qualityChecks = [
    {
      label: "Personal details",
      done: Boolean(
        resumeData.personalInfo.fullName?.trim() &&
          resumeData.personalInfo.email?.trim() &&
          resumeData.personalInfo.phone?.trim() &&
          resumeData.personalInfo.location?.trim()
      ),
    },
    { label: "Summary written", done: Boolean(resumeData.summary?.trim()) },
    { label: "Experience added", done: resumeData.workExperience.length > 0 },
    { label: "Education added", done: resumeData.education.length > 0 },
    { label: "Skills added", done: resumeData.skills.length > 0 },
  ];
  const completedChecks = qualityChecks.filter((item) => item.done).length;
  const builderSuggestions = [
    resumeData.summary?.trim()
      ? "Keep your summary concise and aligned with the strongest proof points in your experience."
      : "Write a short summary that explains your value in two or three focused sentences.",
    resumeData.workExperience.length > 0
      ? "Add outcome-driven metrics to your strongest role for more recruiter signal."
      : "Add at least one experience entry to unlock stronger preview quality and export confidence.",
    resumeData.skills.length > 0
      ? "Keep your skills section focused on the tools and capabilities you can defend in interviews."
      : "Add your strongest tools, platforms, and domain skills so the resume reads as complete.",
  ];
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

  useEffect(() => {
    if (!visibleTemplates.length) {
      setFocusedTemplateId(null);
      return;
    }

    const currentFocusedVisible = visibleTemplates.some((template) => template.id === focusedTemplateId);
    if (currentFocusedVisible) return;

    const selectedVisible = visibleTemplates.find((template) => template.id === selectedTemplate);
    setFocusedTemplateId((selectedVisible ?? visibleTemplates[0]).id);
  }, [focusedTemplateId, selectedTemplate, visibleTemplates]);

  const focusedTemplate = orderedTemplates.find((template) => template.id === focusedTemplateId) ?? orderedTemplates[0] ?? null;

  function focusTemplate(templateId: TemplateId, scrollToPreview = false) {
    setFocusedTemplateId(templateId);
    shouldScrollToPreviewRef.current =
      scrollToPreview && typeof window !== "undefined" && window.matchMedia("(max-width: 1279px)").matches;
  }

  useEffect(() => {
    if (!focusedTemplateId || !shouldScrollToPreviewRef.current) return;

    shouldScrollToPreviewRef.current = false;
    requestAnimationFrame(() => {
      setPreviewPulse(true);
      previewPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [focusedTemplateId]);

  useEffect(() => {
    if (!previewPulse) return;

    const timeoutId = window.setTimeout(() => setPreviewPulse(false), 900);
    return () => window.clearTimeout(timeoutId);
  }, [previewPulse]);

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

        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 pb-10 pt-4 sm:px-6">
          <ScrollReveal delayMs={50}>
            <section className="overflow-hidden rounded-[36px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_28%),linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] p-6 shadow-[0_28px_70px_-46px_rgba(15,23,42,0.32)] md:p-8">
              <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
                <div>
                  <span className="crp-badge">Template Studio</span>
                  <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                    Design the resume first impression before you write a single line
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
                    Pick a template, import an existing resume, or start fresh — then move straight into the builder without changing your workflow.
                  </p>

                  {resumeHistory.length > 0 && (
                    <div className="mt-6 max-w-md">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500" htmlFor="saved-resume-select">
                        Continue from a saved resume
                      </label>
                      <select
                        id="saved-resume-select"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm"
                        defaultValue=""
                        onChange={(e) => {
                          const id = e.target.value;
                          if (!id) return;
                          const rec = resumeHistory.find((r) => r.id === id);
                          if (!rec) return;
                          setResumeData(rec.resumeSnapshot);
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
                  )}
                </div>

                <div className="rounded-[30px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_32px_70px_-42px_rgba(15,23,42,0.65)] md:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">Flow</p>
                      <h2 className="mt-2 text-2xl font-bold tracking-tight">Choose, import, edit</h2>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-100">
                      <LayoutTemplate className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {[
                      "Find a visual direction that matches your role and level.",
                      "Import an existing resume or move into a blank tailored draft.",
                      "Use the builder to refine content without losing template flexibility.",
                    ].map((item, index) => (
                      <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                          0{index + 1}
                        </div>
                        <p className="text-sm leading-relaxed text-slate-200">{item}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setMode("form")}
                      className="crp-btn-primary min-h-[44px] flex-1 px-5 py-3 text-sm"
                    >
                      Skip to builder
                    </button>
                    <div className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
                      {recommendedTemplateIds.length > 0 ? "Recommended templates available" : `${visibleTemplates.length} templates available`}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal delayMs={100}>
            <section className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.22)] md:p-5">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Filter studio</p>
                  <p className="mt-1 text-sm text-slate-600">Narrow the catalog without changing the underlying selection flow.</p>
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

                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
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

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <select
                      value={activeRoleCategory}
                      onChange={(event) => setActiveRoleCategory(event.target.value as RoleCategory)}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-700"
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
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-700"
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
            </section>
          </ScrollReveal>

          <ScrollReveal delayMs={150}>
            {!!orderedTemplates.length && focusedTemplate && (
              <section className="space-y-6">
                <div className="rounded-[36px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f6f8fb_100%)] p-4 shadow-[0_26px_70px_-46px_rgba(15,23,42,0.24)] md:p-6">
                  <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Template gallery</p>
                      <h4 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">A focused browsing layout with a persistent preview</h4>
                      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
                        Scroll the template column on the left while the large preview stays visible on the right — choose once it feels right.
                      </p>
                    </div>
                    <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {orderedTemplates.length} templates
                    </div>
                  </div>

                  <div className="grid gap-5 xl:grid-cols-[minmax(280px,30%)_minmax(0,70%)] xl:items-start">
                    <div className="rounded-[30px] border border-slate-200 bg-white p-3 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.2)] xl:h-[920px] xl:overflow-hidden">
                      <div className="mb-3 flex items-center justify-between gap-3 px-2">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Templates</p>
                        </div>
                      </div>

                      <div className="space-y-3 xl:h-[820px] xl:overflow-y-auto xl:pr-2">
                        {orderedTemplates.map((t) => {
                          const isFocused = focusedTemplate.id === t.id;

                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => focusTemplate(t.id, true)}
                              className={`crp-template-rail-item w-full rounded-[26px] border p-3 text-left ${
                                isFocused
                                  ? "border-slate-900 bg-slate-900 text-white shadow-[0_28px_70px_-42px_rgba(15,23,42,0.55)]"
                                  : "border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] text-slate-900 hover:border-indigo-200 hover:bg-indigo-50/30"
                              }`}
                            >
                              <div className="flex gap-3">
                                <div className={`w-20 shrink-0 overflow-hidden rounded-2xl border p-1 ${isFocused ? "border-white/10 bg-white/10" : "border-slate-200 bg-white"}`}>
                                  <TemplatePreviewCard template={t} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {t.isPremium && <span className="crp-premium-badge">{t.premiumBadgeType ?? "Premium"}</span>}
                                    {t.atsScore != null && <span className="crp-ats-badge">ATS {t.atsScore}</span>}
                                    {recommendedTemplateIds.includes(t.id) && (
                                      <span className="crp-ai-pick-badge">
                                        <span className="text-[11px]">✨ Recommended</span>
                                      </span>
                                    )}
                                  </div>

                                  <p className={`mt-2 truncate text-sm font-semibold ${isFocused ? "text-white" : "text-slate-900"}`}>{t.name}</p>
                                  <p className={`mt-1 text-xs leading-relaxed ${isFocused ? "text-slate-300" : "text-slate-600"}`}>{t.style}</p>
                                  <p className={`mt-2 line-clamp-2 text-xs leading-relaxed ${isFocused ? "text-slate-300" : "text-slate-500"}`}>{t.description}</p>

                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {t.tags.slice(0, 2).map((tag) => (
                                      <span
                                        key={tag}
                                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                                          isFocused ? "border border-white/10 bg-white/10 text-slate-200" : "border border-slate-200 bg-white text-slate-600"
                                        }`}
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>

                                  <div className="mt-3" onClick={(event) => event.stopPropagation()}>
                                    <AccentColorPicker templateId={t.id} onColorSelect={() => focusTemplate(t.id, true)} />
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div
                      ref={previewPanelRef}
                      className={`rounded-[30px] border bg-slate-950 p-4 text-white shadow-[0_30px_80px_-44px_rgba(15,23,42,0.62)] transition-all duration-500 md:p-6 ${
                        previewPulse
                          ? "border-cyan-300 shadow-[0_0_0_1px_rgba(165,243,252,0.55),0_30px_80px_-44px_rgba(34,211,238,0.45)]"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {focusedTemplate.isPremium && (
                          <span className="crp-premium-badge">{focusedTemplate.premiumBadgeType ?? "Premium"}</span>
                        )}
                        {focusedTemplate.atsScore != null && <span className="crp-ats-badge">ATS {focusedTemplate.atsScore}</span>}
                        {recommendedTemplateIds.includes(focusedTemplate.id) && (
                          <span className="crp-ai-pick-badge">
                            <span className="text-[11px]">✨ Recommended</span>
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex flex-col gap-3 md:items-start">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">Live preview</p>
                          <h4 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">{focusedTemplate.name}</h4>
                          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">{focusedTemplate.description}</p>
                        </div>
                      </div>

                      <div key={focusedTemplate.id} className="crp-template-stage mt-5 rounded-[28px] border border-white/10 bg-white/5 p-3 md:p-4">
                        <div className="rounded-[22px] border border-white/10 bg-white p-2 shadow-[0_32px_70px_-52px_rgba(15,23,42,0.6)] transition-transform duration-500 ease-out">
                          <TemplatePreviewCard template={focusedTemplate} />
                        </div>
                      </div>

                      <div className="mt-4 rounded-[24px] border border-white/10 bg-white/5 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">Color options</p>
                            <p className="mt-1 text-sm text-slate-300">Try the preset accents for this template before applying it.</p>
                          </div>
                          <AccentColorPicker templateId={focusedTemplate.id} />
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-1.5">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-200">
                          {focusedTemplate.style}
                        </span>
                        {focusedTemplate.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-slate-300">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {!!focusedTemplate.recommendedFor?.length && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {focusedTemplate.recommendedFor.slice(0, 3).map((role) => (
                            <span key={role} className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium text-cyan-100">
                              {role}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-6 border-t border-white/10 pt-5">
                        <button
                          type="button"
                          onClick={() => askStartPath(focusedTemplate.id)}
                          className="crp-btn-primary min-h-[48px] w-full px-5 py-3 text-sm"
                        >
                          Select this template
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
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

          {fileInput}
        </ScrollReveal>
        </main>

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

        <SiteFooter />
      </div>
    );
  }

  // ── Form screen ──────────────────────────────────────────────────────────────
  return (
    <div className="crp-shell min-h-screen max-w-full overflow-x-hidden text-sm md:text-base">
      <SiteHeader />

      <FlowStrip activeStep={currentStep === "preview" ? 2 : 1} />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 pb-10 pt-6 sm:px-6">
        <ScrollReveal delayMs={60}>
          <section className="overflow-hidden rounded-[36px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_28%),linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] p-6 shadow-[0_28px_70px_-46px_rgba(15,23,42,0.32)] md:p-8">
            <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
              <div>
                <span className="crp-badge">Resume Builder</span>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">A cleaner editing workspace with the same workflow underneath.</h1>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
                  Your step flow, parsing, and template logic stay the same. This shell just makes the editing workspace easier to scan and use.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Current step</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{currentStepMeta.title}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Template</p>
                    <p className="mt-2 text-sm font-semibold capitalize text-slate-900">{selectedTemplate}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Quality checks</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{completedChecks}/5 completed</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[30px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_32px_70px_-42px_rgba(15,23,42,0.65)] md:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">Workspace status</p>
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">What you are editing</p>
                    <p className="mt-2 text-lg font-semibold text-white">{currentStepMeta.title}</p>
                    <p className="mt-1 text-sm text-slate-300">{currentStepMeta.helper}</p>
                  </div>

                  {!prefilled && (
                    <button
                      type="button"
                      onClick={() => document.getElementById("resume-upload-input")?.click()}
                      disabled={uploading}
                      aria-busy={uploading}
                      className={`min-h-[48px] w-full rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition ${
                        uploading ? "opacity-90 cursor-wait" : "hover:bg-slate-100"
                      }`}
                    >
                      {uploading ? (UPLOAD_MESSAGES[uploadMsgIdx] ?? "Reading your resume...") : "Upload resume into this workspace"}
                    </button>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {qualityChecks.slice(0, 4).map((item) => (
                      <div key={item.label} className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${item.done ? "bg-emerald-50 text-emerald-700" : "bg-white/10 text-slate-300"}`}>
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal delayMs={130}>
          <section className="grid gap-6 xl:grid-cols-[290px_minmax(0,1fr)] xl:items-start">
            <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
              <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-46px_rgba(15,23,42,0.24)]">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Step navigator</p>
                <div className="hidden xl:block">
                  <StepIndicator variant="vertical" />
                </div>
                <div className="xl:hidden">
                  <StepIndicator />
                </div>
              </div>

              <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-46px_rgba(15,23,42,0.24)]">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Wand2 className="h-4 w-4 text-cyan-600" />
                  AI suggestions
                </div>
                <div className="mt-3 space-y-3">
                  {builderSuggestions.slice(0, 2).map((item) => (
                    <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <section className="min-w-0 space-y-4">
              {showPrefillBanner && (
                <div className="relative rounded-2xl border border-green-200 bg-green-50/95 p-4 text-sm">
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

              <div className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-[0_24px_60px_-46px_rgba(15,23,42,0.24)] md:p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">{currentStepMeta.title}</p>
                    <p className="mt-2 text-sm text-slate-600">{currentStepMeta.helper}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {qualityChecks.map((item) => (
                      <div key={item.label} className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${item.done ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={currentStep === "preview" ? "max-w-full overflow-x-hidden" : "app-panel max-w-full overflow-x-hidden rounded-[30px] p-4 md:p-6 lg:p-8"} key={uploadKey}>
                {renderStep()}
              </div>
            </section>
          </section>
        </ScrollReveal>
      </main>

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

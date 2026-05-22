import type { ResumeData } from "@/types/resume";

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

let pdfJsLoadPromise: Promise<PdfLib> | null = null;

async function loadPdfJs(): Promise<PdfLib> {
  const w = window as Window & { pdfjsLib?: PdfLib };
  if (w.pdfjsLib) {
    return w.pdfjsLib;
  }

  if (!pdfJsLoadPromise) {
    pdfJsLoadPromise = new Promise<PdfLib>((resolve, reject) => {
      const pdfjsVersion = "3.11.174";
      const script = document.createElement("script");
      script.src = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.min.js`;
      script.onload = () => {
        if (!w.pdfjsLib) {
          reject(new Error("PDF.js failed to initialize."));
          return;
        }
        w.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;
        resolve(w.pdfjsLib);
      };
      script.onerror = () => reject(new Error("Failed to load PDF.js from CDN."));
      document.head.appendChild(script);
    }).catch((error) => {
      pdfJsLoadPromise = null;
      throw error;
    });
  }

  return pdfJsLoadPromise;
}

function extractPdfLineText(items: Array<{ x: number; text: string }>): string {
  const sorted = items.sort((a, b) => a.x - b.x);
  return sorted
    .map((item, index) => {
      if (index === 0) return item.text;
      const previous = sorted[index - 1];
      const gap = item.x - previous.x;
      return gap > 24 ? `  ${item.text}` : ` ${item.text}`;
    })
    .join("")
    .trim();
}

function buildLayoutAwarePageText(items: Array<{ x: number; y: number; text: string }>, pageWidth: number): string {
  const lineBuckets = new Map<number, Array<{ x: number; text: string }>>();

  for (const item of items) {
    const key = Math.round(item.y / 3) * 3;
    const existing = lineBuckets.get(key) ?? [];
    existing.push({ x: item.x, text: item.text });
    lineBuckets.set(key, existing);
  }

  const lines = Array.from(lineBuckets.entries())
    .map(([y, lineItems]) => {
      const minX = Math.min(...lineItems.map((item) => item.x));
      return { y, minX, text: extractPdfLineText(lineItems) };
    })
    .filter((line) => line.text);

  if (!lines.length) return "";

  const starts = [...new Set(lines.map((line) => Math.round(line.minX / 8) * 8))].sort((a, b) => a - b);
  const splitThreshold = Math.max(120, pageWidth * 0.22);
  const columns: number[] = [];

  for (const start of starts) {
    const previous = columns[columns.length - 1];
    if (previous == null || Math.abs(start - previous) > splitThreshold) {
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
  for (let index = 0; index < columns.length; index++) {
    byColumn.set(index, []);
  }

  for (const line of lines) {
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < columns.length; index++) {
      const distance = Math.abs(line.minX - columns[index]);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    }

    byColumn.get(bestIndex)!.push(line);
  }

  return columns
    .map((_, index) =>
      (byColumn.get(index) ?? [])
        .sort((a, b) => b.y - a.y)
        .map((line) => line.text)
        .join("\n")
        .trim()
    )
    .filter(Boolean)
    .join("\n\n");
}

async function extractPdfData(file: File): Promise<{ text: string; layoutText: string; images: string[] }> {
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];
  const layoutTexts: string[] = [];
  const images: string[] = [];
  const pagesToProcess = Math.min(pdf.numPages, 3);

  for (let pageNumber = 1; pageNumber <= pagesToProcess; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
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
          .sort((a, b) => a.x - b.x)
          .map((item) => item.text)
          .join(" ")
          .trim()
      )
      .filter(Boolean);

    pageTexts.push(sortedLines.join("\n"));

    const viewport = page.getViewport({ scale: 1.8 });
    const layoutText = buildLayoutAwarePageText(positionedItems, viewport.width);
    layoutTexts.push(layoutText || sortedLines.join("\n"));

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

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Failed to parse the resume.");
  }
  return payload;
}

export async function parseResumeFile(file: File): Promise<ResumeData> {
  const fileName = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || fileName.endsWith(".pdf");
  const isDocx =
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx");

  if (!isPdf && !isDocx) {
    throw new Error("Please upload a PDF or DOCX resume.");
  }

  let response: Response;

  if (isPdf) {
    const { text, layoutText, images } = await extractPdfData(file);
    response = await fetch("/api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, layoutText, images }),
    });
  } else {
    const form = new FormData();
    form.append("resume", file);
    response = await fetch("/api/parse", { method: "POST", body: form });
  }

  return parseJsonResponse<ResumeData>(response);
}
import { NextRequest, NextResponse } from "next/server";
import { parseResume } from "@/lib/parseResume";
import { extractResumeSignals, extractResumeStructure } from "@/lib/resume-intelligence";

// POST /api/parse — AI-powered (Gemini) resume parsing with regex fallback
// Body A (PDF):  JSON  { text: string, layoutText?: string, images?: string[] }
//                — text extracted client-side with PDF.js (layoutText preserves multi-column order)
// Body B (DOCX): FormData { resume: File } — server extracts text with mammoth

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function normalizeExtractedText(input: string): string {
  return input
    .replace(/\u00a0/g, " ")
    .replace(/\t/g, "  ")
    .replace(/([^\n])-\n([a-z])/g, "$1$2")
    .replace(/[ \t]{3,}/g, "  ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 1 && value.length < 80))];
}

function normalizeSkillsList(items: unknown, fallback: string[]): string[] {
  const aiItems = Array.isArray(items) ? items : [];
  return uniqueStrings([...aiItems.map((item) => cleanString(item)), ...fallback]);
}

function mergeCertificationItems(
  fallback: ReturnType<typeof parseResume>["certifications"],
  signalNames: string[]
) {
  const merged = [...fallback];
  const seen = new Set(fallback.map((item) => item.name.toLowerCase()));

  for (const name of signalNames) {
    const trimmed = cleanString(name);
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push({
      id: uid(),
      name: trimmed,
      issuer: "",
      date: "",
    });
  }

  return merged;
}

export async function POST(req: NextRequest) {
  // ── 1. Extract raw text (and optional page images for vision) ────────────────
  const contentType = req.headers.get("content-type") ?? "";
  let text = "";
  let layoutText = "";
  let images: string[] = []; // base64 data URLs from PDF pages

  try {
    if (contentType.includes("application/json")) {
      const body = await req.json();
      if (typeof body.text !== "string") {
        return NextResponse.json({ error: "Missing text field." }, { status: 400 });
      }
      text = body.text;
      layoutText = typeof body.layoutText === "string" ? body.layoutText : "";
      if (Array.isArray(body.images)) {
        // Validate and keep up to 3 data-URL images
        images = (body.images as unknown[])
          .filter((img): img is string => typeof img === "string" && img.startsWith("data:image/"))
          .slice(0, 3);
      }
    } else {
      const formData = await req.formData();
      const file = formData.get("resume") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
      }
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "File must be under 5 MB." }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    }

    if (!text.trim() && images.length === 0) {
      return NextResponse.json({ error: "Could not extract content from the file." }, { status: 422 });
    }
  } catch (err) {
    console.error("[/api/parse] Text extraction error:", err);
    return NextResponse.json({ error: "Failed to read the file." }, { status: 500 });
  }

  // ── 2. Deterministic extraction with skill enrichment ───────────────────────
  try {
    const normalizedText = normalizeExtractedText(text);
    const normalizedLayoutText = normalizeExtractedText(layoutText);
    const parseSourceText = normalizedLayoutText || normalizedText;
    const parsed = await extractResumeStructure({ resumeText: parseSourceText, images });
    const resumeSignals = await extractResumeSignals({ resumeText: parseSourceText, resumeData: parsed });

    const response = {
      personalInfo: parsed.personalInfo,
      summary: parsed.summary,
      workExperience: parsed.workExperience,
      education: parsed.education,
      skills: normalizeSkillsList(
        [
          ...parsed.skills,
          ...resumeSignals.skills,
          ...resumeSignals.technologies,
          ...resumeSignals.tools,
          ...resumeSignals.frameworks,
          ...resumeSignals.methodologies,
        ],
        []
      ),
      certifications: mergeCertificationItems(parsed.certifications, resumeSignals.certifications),
      targetRole: parsed.targetRole || resumeSignals.jobTitles[0] || parsed.personalInfo.jobTitle,
    };

    return NextResponse.json(response);
  } catch (error) {
    // ── 3. Fallback to regex parser if enrichment fails ───────────────────────
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[/api/parse] Deterministic parse failed:", msg);
    try {
      const fallbackText = normalizeExtractedText(layoutText) || normalizeExtractedText(text);
      const parsed = parseResume(fallbackText);
      return NextResponse.json(parsed);
    } catch (fallbackErr) {
      console.error("[/api/parse] Regex fallback also failed:", fallbackErr);
      return NextResponse.json({ error: "Failed to parse resume." }, { status: 500 });
    }
  }
}

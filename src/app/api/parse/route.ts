import { NextRequest, NextResponse } from "next/server";
import { generate, generateWithImages } from "@/lib/openai";
import { parseResume } from "@/lib/parseResume";

// POST /api/parse — AI-powered (Gemini) resume parsing with regex fallback
// Body A (PDF):  JSON  { text: string, layoutText?: string, images?: string[] }
//                — text extracted client-side with PDF.js (layoutText preserves multi-column order)
// Body B (DOCX): FormData { resume: File } — server extracts text with mammoth

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

const SYSTEM_PROMPT = `You are an expert resume parser. Extract all structured information from the resume text.
Return ONLY a valid JSON object — no markdown, no code fences, no explanation.

Use this exact schema:
{
  "personalInfo": {
    "fullName": "string",
    "email": "string",
    "phone": "string",
    "location": "string (City, State or City, Country)",
    "linkedin": "string (full URL or empty)",
    "website": "string (full URL or empty)",
    "jobTitle": "string (current or most recent title)"
  },
  "summary": "string (professional summary/objective, empty if not present)",
  "workExperience": [
    {
      "company": "string",
      "title": "string",
      "location": "string",
      "startDate": "string (e.g. Jan 2020 or 2020)",
      "endDate": "string (e.g. Mar 2023 or Present)",
      "bullets": ["string", "string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string (e.g. Bachelor of Science)",
      "field": "string (e.g. Computer Science)",
      "startDate": "string",
      "endDate": "string",
      "gpa": "string (empty if not present)",
      "honors": "string (e.g. Cum Laude, empty if not present)"
    }
  ],
  "skills": ["string", "string"],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "string"
    }
  ],
  "targetRole": "string (same as jobTitle)"
}

Rules:
- Extract ALL work experience entries, education entries, and skills
- bullets: list every responsibility/achievement as a separate string — do NOT combine them
- skills: flat list of individual skills (split any comma/semicolon-separated lists)
- If a field is absent, use "" or [] as appropriate
- Dates: preserve the original format from the resume`;

function bulletsToHtml(bullets: string[]): string {
  const clean = bullets.map((b) => b.trim()).filter(Boolean);
  if (!clean.length) return "";
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<ul>${clean.map((b) => `<li><p>${esc(b)}</p></li>`).join("")}</ul>`;
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

function normalizeExperienceItems(
  items: unknown,
  fallback: ReturnType<typeof parseResume>["workExperience"]
) {
  const aiItems = Array.isArray(items) ? items : [];
  const total = Math.max(aiItems.length, fallback.length);

  return Array.from({ length: total }, (_, index) => {
    const ai = (aiItems[index] ?? {}) as {
      company?: unknown;
      title?: unknown;
      location?: unknown;
      startDate?: unknown;
      endDate?: unknown;
      description?: unknown;
      bullets?: unknown;
    };
    const fb = fallback[index];
    const bullets = Array.isArray(ai.bullets)
      ? ai.bullets.map((bullet) => cleanString(bullet)).filter(Boolean)
      : [];

    return {
      id: uid(),
      company: cleanString(ai.company) || fb?.company || "",
      title: cleanString(ai.title) || fb?.title || "",
      location: cleanString(ai.location) || fb?.location || "",
      startDate: cleanString(ai.startDate) || fb?.startDate || "",
      endDate: cleanString(ai.endDate) || fb?.endDate || "",
      description:
        cleanString(ai.description) || (bullets.length ? bulletsToHtml(bullets) : fb?.description || ""),
    };
  }).filter((entry) => entry.company || entry.title || entry.description || entry.startDate || entry.endDate);
}

function normalizeEducationItems(
  items: unknown,
  fallback: ReturnType<typeof parseResume>["education"]
) {
  const aiItems = Array.isArray(items) ? items : [];
  const total = Math.max(aiItems.length, fallback.length);

  return Array.from({ length: total }, (_, index) => {
    const ai = (aiItems[index] ?? {}) as {
      institution?: unknown;
      degree?: unknown;
      field?: unknown;
      startDate?: unknown;
      endDate?: unknown;
      gpa?: unknown;
      honors?: unknown;
    };
    const fb = fallback[index];

    return {
      id: uid(),
      institution: cleanString(ai.institution) || fb?.institution || "",
      degree: cleanString(ai.degree) || fb?.degree || "",
      field: cleanString(ai.field) || fb?.field || "",
      startDate: cleanString(ai.startDate) || fb?.startDate || "",
      endDate: cleanString(ai.endDate) || fb?.endDate || "",
      gpa: cleanString(ai.gpa) || fb?.gpa || "",
      honors: cleanString(ai.honors) || fb?.honors || "",
    };
  }).filter((entry) => entry.institution || entry.degree || entry.field || entry.startDate || entry.endDate);
}

function normalizeCertificationItems(
  items: unknown,
  fallback: ReturnType<typeof parseResume>["certifications"]
) {
  const aiItems = Array.isArray(items) ? items : [];
  const total = Math.max(aiItems.length, fallback.length);

  return Array.from({ length: total }, (_, index) => {
    const ai = (aiItems[index] ?? {}) as {
      name?: unknown;
      issuer?: unknown;
      date?: unknown;
    };
    const fb = fallback[index];

    return {
      id: uid(),
      name: cleanString(ai.name) || fb?.name || "",
      issuer: cleanString(ai.issuer) || fb?.issuer || "",
      date: cleanString(ai.date) || fb?.date || "",
    };
  }).filter((entry) => entry.name || entry.issuer || entry.date);
}

function normalizeSkillsList(items: unknown, fallback: string[]): string[] {
  const aiItems = Array.isArray(items) ? items : [];
  return uniqueStrings([...aiItems.map((item) => cleanString(item)), ...fallback]);
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

  // ── 2. AI-powered extraction via Gemini (vision + text) ──────────────────────
  try {
    const normalizedText = normalizeExtractedText(text);
    const normalizedLayoutText = normalizeExtractedText(layoutText);
    const parseSourceText = normalizedLayoutText || normalizedText;
    const fallbackParsed = parseResume(parseSourceText);

    let raw: string;

    if (images.length > 0) {
      // Vision: send rendered page images so Gemini can read ANY layout
      const hint = parseSourceText.trim()
        ? `\n\nExtracted text with layout hints (use as support, images are authoritative):\n${parseSourceText.slice(0, 7000)}`
        : "";
      const prompt = `${SYSTEM_PROMPT}\n\nParse this resume from the page images. Each image is one page.${hint}`;
      raw = await generateWithImages(prompt, images, 0);
    } else {
      // Text-only (DOCX or text-layer PDF without images)
      const prompt = `${SYSTEM_PROMPT}\n\nParse this resume:\n\n${parseSourceText.slice(0, 12000)}`;
      raw = await generate(prompt, 0);
    }

    // Strip any accidental markdown fences
    const jsonStr = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const ai = JSON.parse(jsonStr);

    // ── 3. Normalize into app's data shape ──────────────────────────────────────
    const workExperience = normalizeExperienceItems(ai.workExperience, fallbackParsed.workExperience);
    const education = normalizeEducationItems(ai.education, fallbackParsed.education);
    const certifications = normalizeCertificationItems(ai.certifications, fallbackParsed.certifications);

    const parsed = {
      personalInfo: {
        fullName: cleanString(ai.personalInfo?.fullName) || fallbackParsed.personalInfo.fullName,
        email: cleanString(ai.personalInfo?.email) || fallbackParsed.personalInfo.email,
        phone: cleanString(ai.personalInfo?.phone) || fallbackParsed.personalInfo.phone,
        location: cleanString(ai.personalInfo?.location) || fallbackParsed.personalInfo.location,
        linkedin: cleanString(ai.personalInfo?.linkedin) || fallbackParsed.personalInfo.linkedin,
        website: cleanString(ai.personalInfo?.website) || fallbackParsed.personalInfo.website,
        jobTitle: cleanString(ai.personalInfo?.jobTitle) || fallbackParsed.personalInfo.jobTitle,
      },
      summary: cleanString(ai.summary) || fallbackParsed.summary,
      workExperience,
      education,
      skills: normalizeSkillsList(ai.skills, fallbackParsed.skills),
      certifications,
      targetRole:
        cleanString(ai.targetRole) || cleanString(ai.personalInfo?.jobTitle) || fallbackParsed.targetRole,
    };

    return NextResponse.json(parsed);
  } catch (aiErr) {
    // ── 4. Fallback to regex parser if AI fails ──────────────────────────────
    const msg = aiErr instanceof Error ? aiErr.message : String(aiErr);
    console.error("[/api/parse] Gemini parse failed, falling back to regex:", msg);
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

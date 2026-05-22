import { NextRequest, NextResponse } from "next/server";
import { generate } from "@/lib/openai";
import type { ResumeData } from "@/types/resume";

// POST /api/generate
// Body: { field: "summary" | "bullets" | "optimize", resumeData, rawText?, htmlContent?, selectedText?, jobTitle? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { field, resumeData, rawText, htmlContent, selectedText, jobTitle } = body as {
      field: "summary" | "bullets" | "optimize" | "suggest-skills";
      resumeData: ResumeData;
      rawText?: string;
      htmlContent?: string;
      selectedText?: string;
      jobTitle?: string;
    };

    if (field === "summary") {
      const parts = [
        "You are a professional resume writer. Write a concise, compelling 3-4 sentence professional summary.",
        "Focus on their key skills, experience level, and career goals. Return only the summary paragraph - no labels, no markdown.",
        "",
        "Candidate details:",
        "- Name: " + resumeData.personalInfo.fullName,
        "- Target Role: " + resumeData.targetRole,
        "- Skills: " + resumeData.skills.join(", "),
        "- Most recent role: " +
          (resumeData.workExperience[0]?.title || "N/A") +
          " at " +
          (resumeData.workExperience[0]?.company || "N/A"),
        resumeData.jobDescription
          ? "- Job Description they are targeting:\n" +
            resumeData.jobDescription.slice(0, 800)
          : "",
      ];
      const text = await generate(parts.join("\n"), 0.7);
      return NextResponse.json({ result: text.trim() });
    }

    if (field === "bullets") {
      const parts = [
        "You are a professional resume writer. Convert the following raw job responsibility text into 3-5 powerful, achievement-oriented resume bullet points.",
        "Use strong action verbs, quantify results where implied. Return ONLY a JSON array of strings - no explanations, no markdown.",
        "",
        "Target role: " + resumeData.targetRole,
        "Job title: " + (jobTitle || "Not specified"),
        "Raw input: " + rawText,
        resumeData.jobDescription
          ? "Job description:\n" + resumeData.jobDescription.slice(0, 600)
          : "",
      ];
      const content = await generate(parts.join("\n"), 0.6);
      const jsonStr = content
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
      let bullets: string[] = [];
      try {
        const parsed = JSON.parse(jsonStr);
        bullets =
          parsed.bullets ||
          parsed.result ||
          (Array.isArray(parsed) ? parsed : []);
      } catch {
        bullets = content
          .split(/\n/)
          .map((l: string) => l.replace(/^[-*\d.]+\s*/, "").trim())
          .filter(Boolean);
      }
      return NextResponse.json({ result: bullets });
    }

    if (field === "optimize") {
      if (selectedText?.trim()) {
        const selectedLines = selectedText
          .split(/\r?\n/)
          .map((l) => l.replace(/^[-*•\d.)\s]+/, "").trim())
          .filter(Boolean);

        if (selectedLines.length > 1) {
          const parts = [
            "You are an experienced hiring manager and resume coach.",
            "Rewrite each selected line so it sounds natural and human-written while preserving meaning.",
            "Rules:",
            "- Keep one output line per input line in the same order.",
            "- Keep all original facts; do not invent metrics.",
            "- Keep concise, direct wording and avoid AI-sounding cliches.",
            "- Return ONLY a JSON array of strings.",
            "",
            "Job title: " + (jobTitle || "Not specified"),
            "Target role: " + (resumeData?.targetRole || "Not specified"),
            "",
            "Selected lines:",
            selectedLines.join("\n"),
          ];

          const rewritten = await generate(parts.join("\n"), 0.75);
          const jsonStr = rewritten
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```$/, "")
            .trim();

          let resultLines: string[] = [];
          try {
            const parsed = JSON.parse(jsonStr);
            resultLines = (Array.isArray(parsed) ? parsed : parsed.bullets || parsed.result || []) as string[];
          } catch {
            resultLines = rewritten
              .split(/\r?\n/)
              .map((l) => l.replace(/^[-*•\d.)\s]+/, "").trim())
              .filter(Boolean);
          }

          const normalized = resultLines
            .flatMap((line) => line.split(/\r?\n/))
            .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
            .filter(Boolean);

          const safeLines =
            normalized.length === selectedLines.length
              ? normalized
              : selectedLines.map((line, i) => normalized[i] || line);

          return NextResponse.json({ resultLines: safeLines });
        }

        const parts = [
          "You are an experienced hiring manager and resume coach.",
          "Rewrite the selected resume line so it sounds natural, specific, and genuinely human-written.",
          "Rules:",
          "- Keep the original meaning and facts. Do not invent metrics.",
          "- Keep it concise (one line).",
          "- Avoid generic AI-sounding phrases like 'leveraged', 'utilized', 'spearheaded' unless it naturally fits.",
          "- Prefer plain, confident wording over buzzwords.",
          "- Return ONLY the rewritten line as plain text (no bullets, no quotes, no markdown).",
          "",
          "Job title: " + (jobTitle || "Not specified"),
          "Target role: " + (resumeData?.targetRole || "Not specified"),
          "",
          "Selected line:",
          selectedText,
        ];

        const rewritten = await generate(parts.join("\n"), 0.75);
        const resultText = rewritten
          .replace(/^[-*\d.\s]+/, "")
          .replace(/^"|"$/g, "")
          .trim();
        return NextResponse.json({ resultText });
      }

      // Strip HTML tags to get plain text, then rephrase preserving every point
      const plainText = (htmlContent || "")
        .replace(/<li[^>]*>/gi, "\n- ")
        .replace(/<\/li>/gi, "")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      const plainTextJoined = plainText.join("\n");

      const parts = [
        "You are an experienced hiring manager and resume editor.",
        "Rewrite each point below so it sounds human, direct, and credible while still being strong for recruiters.",
        "Rules:",
        "- Keep the same meaning and all original points.",
        "- Keep one output bullet per input point, in the same order.",
        "- Keep wording natural and specific; avoid repetitive AI-style phrasing.",
        "- Quantify impact only when numbers are already present or clearly implied.",
        "- Vary sentence openings so bullets do not sound templated.",
        "- Keep ALL points — do NOT drop, merge, or skip any",
        "- If the input has N points, output exactly N points",
        "- Return ONLY a JSON array of strings — no explanations, no markdown fences",
        "",
        "Job title: " + (jobTitle || "Not specified"),
        "Target role: " + (resumeData?.targetRole || "Not specified"),
        "",
        "Bullet points to optimize:",
        plainTextJoined,
      ];

      const content = await generate(parts.join("\n"), 0.75);
      const jsonStr = content
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
      let bullets: string[] = [];
      try {
        const parsed = JSON.parse(jsonStr);
        bullets = Array.isArray(parsed) ? parsed : parsed.bullets || parsed.result || [];
      } catch {
        bullets = content
          .split(/\n/)
          .map((l: string) => l.replace(/^[-*\d.]+\s*/, "").trim())
          .filter(Boolean);
      }

      bullets = bullets
        .flatMap((line) => line.split(/\r?\n/))
        .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
        .filter(Boolean);

      if (!bullets.length) bullets = plainText;

      if (plainText.length > 0 && bullets.length !== plainText.length) {
        if (bullets.length < plainText.length) {
          bullets = [...bullets, ...plainText.slice(bullets.length)];
        } else {
          bullets = bullets.slice(0, plainText.length);
        }
      }

      const resultHtml = `<ul>${bullets.map((b: string) => `<li><p>${b}</p></li>`).join("")}</ul>`;
      return NextResponse.json({ resultHtml });
    }

    if (field === "suggest-skills") {
      const role = resumeData.targetRole || resumeData.personalInfo.jobTitle || "professional";
      const existing = resumeData.skills.join(", ");
      const parts = [
        "You are a career coach and resume expert.",
        `Suggest 12-15 relevant skills for a \"${role}\" role.`,
        existing ? `The candidate already has these skills (do NOT repeat them): ${existing}` : "",
        "Return ONLY a JSON array of skill name strings — short, specific, no explanations.",
        "Mix technical and soft skills appropriate for the role.",
      ].filter(Boolean);
      const content = await generate(parts.join("\n"), 0.7);
      const jsonStr = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      let skills: string[] = [];
      try {
        const parsed = JSON.parse(jsonStr);
        skills = Array.isArray(parsed) ? parsed : parsed.skills || [];
      } catch {
        skills = content.split(/\n/).map((l: string) => l.replace(/^[-*\d."'\s]+/, "").replace(/[",]+$/, "").trim()).filter(Boolean);
      }
      return NextResponse.json({ result: skills });
    }

    return NextResponse.json({ error: "Invalid field" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/generate]", message);
    const isQuota =
      message.includes("429") ||
      message.includes("quota") ||
      message.includes("RESOURCE_EXHAUSTED");
    return NextResponse.json(
      {
        error: isQuota
          ? "AI quota exhausted. Please check your Gemini API key at aistudio.google.com."
          : "AI generation failed: " + message,
      },
      { status: 500 }
    );
  }
}

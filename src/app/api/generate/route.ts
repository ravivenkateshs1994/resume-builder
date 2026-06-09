import { NextRequest, NextResponse } from "next/server";
import { generate } from "@/lib/openai";
import type { ResumeData } from "@/types/resume";

// POST /api/generate
// Body: { field: "summary" | "bullets" | "optimize", resumeData, rawText?, htmlContent?, selectedText?, selectedHtml?, jobTitle? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { field, resumeData, rawText, htmlContent, selectedText, selectedHtml, jobTitle, role } = body as {
      field: "summary" | "bullets" | "optimize" | "suggest-skills" | "sample-jd";
      resumeData: ResumeData;
      rawText?: string;
      htmlContent?: string;
      selectedText?: string;
      selectedHtml?: string;
      jobTitle?: string;
      role?: string;
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
      if (selectedHtml?.trim()) {
        const sourceHtml = selectedHtml;

        const parts = [
          "You are an experienced hiring manager and resume editor.",
          "Rewrite the selected HTML so it sounds human, direct, and credible while still being strong for recruiters.",
          "",
          "CRITICAL — formatting rules:",
          "- The input is HTML. You MUST output valid HTML that mirrors the exact same structure.",
          "- Preserve every tag: <ul>, <ol>, <li>, <p>, <strong>, <em>, <u>, <s>, and any other inline tags.",
          "- If the input has a list, keep it a list with the same number of items.",
          "- If the input has paragraphs, keep them as paragraphs.",
          "- Do NOT convert lists to paragraphs or paragraphs to lists.",
          "- Do NOT add new tags that were not in the original.",
          "- Do NOT drop, merge, or skip any item.",
          "- If you cannot preserve the structure exactly, return the original HTML unchanged rather than flattening it.",
          "",
          "Content rules:",
          "- Rewrite each item so it sounds specific, direct, and naturally human-written.",
          "- Keep the original meaning and all facts — do not invent metrics.",
          "- Vary sentence openings so items do not sound templated.",
          "- Quantify impact only when numbers are already present or clearly implied.",
          "- Avoid generic AI phrases like 'leveraged', 'spearheaded', 'utilized'.",
          "",
          "Output rules:",
          "- Return ONLY the rewritten HTML — no explanations, no markdown fences, no JSON.",
          "",
          "Job title: " + (jobTitle || "Not specified"),
          "Target role: " + (resumeData?.targetRole || "Not specified"),
          "",
          "HTML to optimize:",
          sourceHtml,
        ];

        const content = await generate(parts.join("\n"), 0.75);
        const raw = content
          .replace(/^```(?:html)?\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

        const resultHtml = raw.includes("<") ? raw : sourceHtml;
        return NextResponse.json({ resultHtml });
      }

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

      // Send the original HTML to the AI and ask it to return HTML with formatting preserved.
      const sourceHtml = htmlContent || "";

      const parts = [
        "You are an experienced hiring manager and resume editor.",
        "Rewrite the content below to sound human, direct, and credible while still being strong for recruiters.",
        "",
        "CRITICAL — formatting rules:",
        "- The input is HTML. You MUST output valid HTML that mirrors the exact same structure.",
        "- Preserve every tag: <ul>, <ol>, <li>, <p>, <strong>, <em>, <u>, <s>, and any other inline tags.",
        "- If the input has a <ul> with N <li> items, output a <ul> with exactly N <li> items.",
        "- If the input has <p> paragraphs, output <p> paragraphs.",
        "- Do NOT convert lists to paragraphs or paragraphs to lists.",
        "- Do NOT add new tags that were not in the original.",
        "- Do NOT drop, merge, or skip any item.",
          "- If you cannot preserve the structure exactly, return the original HTML unchanged rather than flattening it.",
        "",
        "Content rules:",
        "- Rewrite each item so it sounds specific, direct, and naturally human-written.",
        "- Keep the original meaning and all facts — do not invent metrics.",
        "- Vary sentence openings so items do not sound templated.",
        "- Quantify impact only when numbers are already present or clearly implied.",
        "- Avoid generic AI phrases like 'leveraged', 'spearheaded', 'utilized'.",
        "",
        "Output rules:",
        "- Return ONLY the rewritten HTML — no explanations, no markdown fences, no JSON.",
        "",
        "Job title: " + (jobTitle || "Not specified"),
        "Target role: " + (resumeData?.targetRole || "Not specified"),
        "",
        "HTML to optimize:",
        sourceHtml,
      ];

      const content = await generate(parts.join("\n"), 0.75);

      // Strip markdown fences in case the model wrapped the response
      const raw = content
        .replace(/^```(?:html)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      let resultHtml: string;

      if (raw.includes("<")) {
        // AI returned HTML as requested — use directly
        resultHtml = raw;
      } else {
        // Fallback: keep the original rich-text structure instead of flattening.
        resultHtml = sourceHtml;
      }

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

    if (field === "sample-jd") {
      const targetRole = (role || resumeData?.targetRole || resumeData?.personalInfo?.jobTitle || "Frontend Engineer").trim();
      const skills = (resumeData?.skills || []).slice(0, 12).join(", ");

      const prompt = [
        "You are a hiring manager writing a realistic job description.",
        `Write a concise, role-specific sample job description for the role: "${targetRole}".`,
        "Output rules:",
        "- Return plain text only (no markdown, no headings with #, no code fences).",
        "- Keep it between 140 and 240 words.",
        "- Include these sections in prose with clear labels: Role Overview, Responsibilities, Requirements, Preferred.",
        "- Keep it practical and ATS-friendly with specific skills and outcomes.",
        "- Do not include salary, location, visa, or legal boilerplate.",
        skills ? `Candidate's known skills for context: ${skills}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const text = await generate(prompt, 0.7);
      return NextResponse.json({ result: text.trim() });
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
          ? "AI quota exhausted. Please check your OpenRouter API key and free model availability."
          : "AI generation failed: " + message,
      },
      { status: 500 }
    );
  }
}

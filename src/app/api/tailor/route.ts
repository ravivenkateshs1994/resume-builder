import { NextRequest, NextResponse } from "next/server";
import { generate } from "@/lib/openai";
import type { ResumeData } from "@/types/resume";

// POST /api/tailor
// Body: { resumeData, jobDescription }
export async function POST(req: NextRequest) {
  try {
    const { resumeData, jobDescription } = (await req.json()) as {
      resumeData: ResumeData;
      jobDescription: string;
    };

    if (!jobDescription?.trim()) {
      return NextResponse.json(
        { error: "Job description is required" },
        { status: 400 }
      );
    }

    const prompt = `You are an ATS resume optimization expert. Analyze the resume data and the target job description, then return an improved version with:
1. A rewritten summary tailored to the job description
2. Improved descriptions for each work experience entry that align with JD keywords (return as HTML: <ul><li><p>text</p></li></ul>)
3. Relevant skills extracted from the JD to add

Return ONLY a valid JSON object with this exact shape (no markdown, no fences):
{
  "summary": "...",
  "workExperience": [
    { "id": "...", "description": "<ul><li><p>...</p></li></ul>" }
  ],
  "additionalSkills": ["...", "..."],
  "atsScore": 85
}

Resume:
Name: ${resumeData.personalInfo.fullName}
Target Role: ${resumeData.targetRole}
Summary: ${resumeData.summary}
Skills: ${resumeData.skills.join(", ")}
Work Experience:
${resumeData.workExperience
  .map(
    (w) => `- ${w.title} at ${w.company}
  Description: ${w.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}
  ID: ${w.id}`
  )
  .join("\n")}

Job Description:
${jobDescription.slice(0, 2000)}
`;

    const content = await generate(prompt, 0.5);
    const jsonStr = content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    const tailored = JSON.parse(jsonStr);

    return NextResponse.json(tailored);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/tailor]", message);
    const isQuota = message.includes("429") || message.includes("quota") || message.includes("RESOURCE_EXHAUSTED");
    return NextResponse.json(
      { error: isQuota
          ? "AI quota exhausted. Please check your Gemini API key at aistudio.google.com."
          : "Tailoring failed. Check your API key." },
      { status: 500 }
    );
  }
}

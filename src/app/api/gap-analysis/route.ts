import { generate } from "@/lib/openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { resumeData, jobDescription } = await req.json();

    if (!jobDescription?.trim()) {
      return NextResponse.json({ error: "Job description is required." }, { status: 400 });
    }

    const resumeSummary = `
Name: ${resumeData?.personalInfo?.fullName || "Unknown"}
Current Role: ${resumeData?.personalInfo?.jobTitle || resumeData?.targetRole || ""}
Summary: ${resumeData?.summary || ""}
Skills: ${(resumeData?.skills || []).join(", ")}
Work Experience:
${(resumeData?.workExperience || [])
  .map(
    (w: { jobTitle?: string; company?: string; description?: string }) =>
      `- ${w.jobTitle || ""} at ${w.company || ""}: ${w.description?.replace(/<[^>]*>/g, "") || ""}`
  )
  .join("\n")}
Education:
${(resumeData?.education || [])
  .map((e: { degree?: string; field?: string; institution?: string }) => `- ${e.degree || ""} in ${e.field || ""} from ${e.institution || ""}`)
  .join("\n")}
Certifications:
${(resumeData?.certifications || [])
  .map((c: { name?: string; issuer?: string }) => `- ${c.name || ""} by ${c.issuer || ""}`)
  .join("\n")}
`.trim();

    const prompt = `You are a career coach and resume expert. Analyze the gap between a candidate's resume and a job description.

RESUME:
${resumeSummary}

JOB DESCRIPTION:
${jobDescription}

Identify the key gaps — skills, tools, certifications, experience, or qualifications — that the candidate is missing or underrepresents compared to what the job requires.

Return ONLY a valid JSON object (no markdown, no explanation) in exactly this format:
{
  "matchScore": <number 0-100>,
  "matchSummary": "<2-sentence summary of how well the resume matches>",
  "gaps": [
    {
      "id": "<unique string>",
      "category": "<one of: Technical Skill | Soft Skill | Tool/Platform | Certification | Domain Knowledge | Experience>",
      "item": "<gap name, concise>",
      "importance": "<high | medium | low>",
      "context": "<1-sentence explanation of why this gap matters for the role>",
      "learningResources": [
        {
          "title": "<resource name>",
          "type": "<course | video | docs | book | practice>",
          "platform": "<Coursera | YouTube | official docs | Udemy | edX | LeetCode | etc>",
          "searchQuery": "<exact search query to find this resource>"
        }
      ]
    }
  ]
}

Include 3-5 learning resources per gap. Focus on free and well-known resources where possible. Return only real, widely-known platforms. Do not invent URLs.`;

    const raw = await generate(prompt, 0.3);

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const result = JSON.parse(jsonMatch[0]);

    return NextResponse.json(result);
  } catch (err) {
    console.error("Gap analysis error:", err);
    return NextResponse.json({ error: "Gap analysis failed." }, { status: 500 });
  }
}

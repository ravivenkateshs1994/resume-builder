import { NextResponse } from "next/server";
import { buildResumeIntelligenceReport } from "@/lib/resume-intelligence";
import type { ResumeData } from "@/types/resume";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      resumeData?: Partial<ResumeData>;
      resumeText?: string;
      jobDescription?: string;
    };

    if (!body.jobDescription?.trim()) {
      return NextResponse.json({ error: "Job description is required." }, { status: 400 });
    }

    if (!body.resumeData && !body.resumeText) {
      return NextResponse.json({ error: "Resume data or resume text is required." }, { status: 400 });
    }

    const report = await buildResumeIntelligenceReport({
      resumeData: body.resumeData,
      resumeText: body.resumeText,
      jobDescription: body.jobDescription,
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Intelligence report error:", error);
    return NextResponse.json({ error: "Failed to build intelligence report." }, { status: 500 });
  }
}

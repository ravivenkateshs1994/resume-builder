import { NextRequest, NextResponse } from "next/server";
import type { ResumeData } from "@/types/resume";
import { defaultAtsScoringService } from "@/lib/ats-engine";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      resumeData?: ResumeData;
      resumeText?: string;
      jobDescription?: string;
    };

    if (!body.jobDescription?.trim()) {
      return NextResponse.json({ error: "Job description is required." }, { status: 400 });
    }

    if (!body.resumeData && !body.resumeText) {
      return NextResponse.json({ error: "Resume data or resume text is required." }, { status: 400 });
    }

    const result = defaultAtsScoringService.optimize({
      resumeData: body.resumeData,
      resumeText: body.resumeText,
      jobDescription: body.jobDescription,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[/api/tailor]", error);
    return NextResponse.json({ error: "ATS optimization failed." }, { status: 500 });
  }
}

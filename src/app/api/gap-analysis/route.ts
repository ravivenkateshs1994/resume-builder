import { NextResponse } from "next/server";
import type { ResumeData } from "@/types/resume";
import { buildGapInsightsFromAnalysis, buildLegacyGapAnalysisResponse, defaultAtsScoringService } from "@/lib/ats-engine";

export async function POST(req: Request) {
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

    const analysis = defaultAtsScoringService.analyze({
      resumeData: body.resumeData,
      resumeText: body.resumeText,
      jobDescription: body.jobDescription,
    });

    return NextResponse.json({
      ...analysis,
      ...buildLegacyGapAnalysisResponse(analysis),
      gaps: buildGapInsightsFromAnalysis(analysis),
    });
  } catch (error) {
    console.error("Gap analysis error:", error);
    return NextResponse.json({ error: "Gap analysis failed." }, { status: 500 });
  }
}

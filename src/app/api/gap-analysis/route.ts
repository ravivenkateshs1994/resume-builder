import { NextResponse } from "next/server";
import type { ResumeData } from "@/types/resume";
import { buildGapInsightsFromAnalysis, buildLegacyGapAnalysisResponse } from "@/lib/ats-engine";
import { buildResumeIntelligenceReport } from "@/lib/resume-intelligence";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      resumeData?: ResumeData;
      resumeText?: string;
      jobDescription?: string;
      careerStage?: string;
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
      careerStage: body.careerStage,
    });

    return NextResponse.json({
      ...report,
      ...report.deterministicAnalysis,
      ...buildLegacyGapAnalysisResponse(report.deterministicAnalysis),
      gaps: buildGapInsightsFromAnalysis(report.deterministicAnalysis),
    });
  } catch (error) {
    console.error("Gap analysis error:", error);
    return NextResponse.json({ error: "Gap analysis failed." }, { status: 500 });
  }
}

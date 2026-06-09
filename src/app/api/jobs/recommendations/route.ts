import { NextResponse } from "next/server";
import type { ResumeData } from "@/types/resume";
import { buildCandidateProfile } from "@/lib/candidate-profile";
import { buildJobFeedSummary, rankJobListings } from "@/lib/job-matching";
import { loadJobListings } from "@/lib/job-feed";

function createEmptyResumeData(): ResumeData {
  return {
    personalInfo: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      website: "",
      jobTitle: "",
    },
    targetRole: "",
    jobDescription: "",
    summary: "",
    workExperience: [],
    education: [],
    skills: [],
    certifications: [],
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      resumeData?: Partial<ResumeData>;
      careerStage?: string;
      query?: string;
      location?: string;
      limit?: number;
    };

    const resumeData = {
      ...createEmptyResumeData(),
      ...(body.resumeData ?? {}),
      personalInfo: {
        ...createEmptyResumeData().personalInfo,
        ...(body.resumeData?.personalInfo ?? {}),
      },
      workExperience: Array.isArray(body.resumeData?.workExperience) ? body.resumeData.workExperience : [],
      education: Array.isArray(body.resumeData?.education) ? body.resumeData.education : [],
      skills: Array.isArray(body.resumeData?.skills) ? body.resumeData.skills : [],
      certifications: Array.isArray(body.resumeData?.certifications) ? body.resumeData.certifications : [],
    } as ResumeData;

    const candidate = buildCandidateProfile({
      resumeData,
      careerStage: body.careerStage,
    });

    const searchLocation = (body.location ?? resumeData.personalInfo.location ?? "").trim();
    const jobs = await loadJobListings({
      query: body.query,
      location: searchLocation,
      careerStage: body.careerStage,
      limit: Math.max(1, Math.min(body.limit ?? 8, 20)),
    });
    const recommendations = rankJobListings(candidate, jobs, {
      query: body.query,
      limit: Math.max(1, Math.min(body.limit ?? 8, 20)),
    });

    return NextResponse.json({
      candidateProfile: candidate,
      summary: buildJobFeedSummary(candidate, recommendations),
      recommendations,
    });
  } catch (error) {
    console.error("[api/jobs/recommendations]", error);
    return NextResponse.json({ error: "Failed to build job recommendations." }, { status: 500 });
  }
}

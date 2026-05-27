import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseUser, getSupabaseServerClient } from "@/lib/supabase/server";
import { stableHash } from "@/lib/utils";
import type { ResumeData } from "@/types/resume";

interface SaveAnalysisBody {
  targetRole: string;
  jobDescription: string;
  resumeSnapshot: ResumeData;
  result: unknown;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireSupabaseUser(request);
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("user_analysis")
      .select("id, created_at, target_role, job_description, resume_snapshot, analysis_result")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({
      analysis: (data ?? []).map((row) => ({
        id: row.id,
        createdAt: row.created_at,
        targetRole: row.target_role,
        jobDescription: row.job_description,
        resumeSnapshot: row.resume_snapshot,
        result: row.analysis_result,
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : (error as { message?: string })?.message ?? "Failed to list analysis.";
    const isAuthError = message.includes("bearer") || message.includes("session") || message.includes("token");
    console.error("[api/cloud/analysis GET]", message, error);
    return NextResponse.json({ error: message }, { status: isAuthError ? 401 : 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSupabaseUser(request);
    const body = (await request.json()) as SaveAnalysisBody;

    if (!body?.jobDescription?.trim()) {
      return NextResponse.json({ error: "jobDescription is required." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const contentHash = stableHash({
      jobDescription: body.jobDescription.trim(),
      targetRole: body.targetRole?.trim() || "",
      resumeSnapshot: body.resumeSnapshot ?? {},
    });
    const payload = {
      user_id: user.id,
      target_role: body.targetRole?.trim() || "",
      job_description: body.jobDescription.trim(),
      resume_snapshot: body.resumeSnapshot ?? {},
      analysis_result: body.result ?? {},
      content_hash: contentHash,
    };

    const { data, error } = await supabase
      .from("user_analysis")
      .upsert(payload, { onConflict: "user_id,content_hash", ignoreDuplicates: false })
      .select("id, created_at, target_role, job_description, resume_snapshot, analysis_result")
      .single();

    if (error) throw error;

    return NextResponse.json({
      analysis: {
        id: data.id,
        createdAt: data.created_at,
        targetRole: data.target_role,
        jobDescription: data.job_description,
        resumeSnapshot: data.resume_snapshot,
        result: data.analysis_result,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : (error as { message?: string })?.message ?? "Failed to save analysis.";
    const isAuthError = message.includes("bearer") || message.includes("session") || message.includes("token");
    console.error("[api/cloud/analysis POST]", message, error);
    return NextResponse.json({ error: message }, { status: isAuthError ? 401 : 500 });
  }
}


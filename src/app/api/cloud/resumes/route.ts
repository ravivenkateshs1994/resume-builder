import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, requireSupabaseUser } from "@/lib/supabase/server";
import { stableHash } from "@/lib/utils";
import type { ResumeData } from "@/types/resume";

interface SaveResumeBody {
  title?: string;
  resumeData: ResumeData;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireSupabaseUser(request);
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("user_resumes")
      .select("id, created_at, updated_at, title, resume_data")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json({ resumes: (data ?? []).map((r: any) => ({ id: r.id, title: r.title, createdAt: r.created_at, updatedAt: r.updated_at, resumeData: r.resume_data })) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list resumes.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSupabaseUser(request);
    const body = (await request.json()) as SaveResumeBody;
    if (!body?.resumeData) {
      return NextResponse.json({ error: "resumeData is required." }, { status: 400 });
    }

    const title = body.title?.trim() || body.resumeData.personalInfo.fullName?.trim() || body.resumeData.targetRole?.trim() || "Resume Draft";
    const contentHash = stableHash(body.resumeData);

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("user_resumes")
      .upsert(
        { user_id: user.id, title, resume_data: body.resumeData, content_hash: contentHash, updated_at: new Date().toISOString() },
        { onConflict: "user_id,content_hash", ignoreDuplicates: false }
      )
      .select("id, created_at, updated_at, title, resume_data")
      .single();

    if (error) throw error;
    return NextResponse.json({ resume: { id: data.id, title: data.title, createdAt: data.created_at, updatedAt: data.updated_at, resumeData: data.resume_data } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save resume.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}


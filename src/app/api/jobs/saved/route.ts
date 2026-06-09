import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseUser, getSupabaseServerClient } from "@/lib/supabase/server";
import { stableHash } from "@/lib/utils";
import type { JobListing } from "@/types/jobs";

function toJobKey(job: Pick<JobListing, "source" | "id">): string {
  return `${job.source}:${job.id}`;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireSupabaseUser(request);
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("saved_jobs")
      .select("id, job_key, source, job_snapshot, match_score, match_reason, status, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({
      jobs: (data ?? []).map((row) => ({
        id: row.id,
        jobKey: row.job_key,
        source: row.source,
        job: row.job_snapshot,
        matchScore: row.match_score,
        matchReason: row.match_reason,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load saved jobs.";
    const isAuthError = message.includes("bearer") || message.includes("session") || message.includes("token");
    return NextResponse.json({ error: message }, { status: isAuthError ? 401 : 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSupabaseUser(request);
    const body = (await request.json()) as {
      job?: JobListing;
      matchScore?: number;
      matchReason?: string;
      status?: string;
    };

    if (!body.job?.id || !body.job?.source) {
      return NextResponse.json({ error: "job is required." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const jobKey = toJobKey(body.job);
    const payload = {
      user_id: user.id,
      job_key: jobKey,
      source: body.job.source,
      job_snapshot: body.job,
      match_score: Number.isFinite(body.matchScore ?? NaN) ? Math.round(Number(body.matchScore)) : 0,
      match_reason: body.matchReason?.trim() || null,
      status: body.status?.trim() || "saved",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("saved_jobs")
      .upsert(payload, { onConflict: "user_id,job_key", ignoreDuplicates: false })
      .select("id, job_key, source, job_snapshot, match_score, match_reason, status, created_at, updated_at")
      .single();

    if (error) throw error;

    return NextResponse.json({
      job: {
        id: data.id,
        jobKey: data.job_key,
        source: data.source,
        job: data.job_snapshot,
        matchScore: data.match_score,
        matchReason: data.match_reason,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
      contentHash: stableHash({ jobKey, userId: user.id }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save job.";
    const isAuthError = message.includes("bearer") || message.includes("session") || message.includes("token");
    return NextResponse.json({ error: message }, { status: isAuthError ? 401 : 500 });
  }
}

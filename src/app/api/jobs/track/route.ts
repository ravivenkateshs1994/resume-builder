import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseUser, getSupabaseServerClient } from "@/lib/supabase/server";
import type { JobListing } from "@/types/jobs";

function toJobKey(job: Pick<JobListing, "source" | "id">): string {
  return `${job.source}:${job.id}`;
}

function extractErrorMessage(err: unknown): string {
  if (!err) return "Unknown error";
  if (typeof err === "object") {
    // PostgrestError from Supabase has message/code/details/hint
    const e = err as Record<string, unknown>;
    const parts = [e.message, e.details, e.hint].filter(Boolean).join(" | ");
    if (parts) return parts;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

export async function POST(request: NextRequest) {
  // Auth check first — return 401 quickly if not logged in
  let userId: string;
  try {
    const user = await requireSupabaseUser(request);
    userId = user.id;
  } catch (authErr) {
    const msg = authErr instanceof Error ? authErr.message : "Unauthorized";
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  let body: { job?: JobListing; eventType?: string; payload?: Record<string, unknown> };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.job?.id || !body.job?.source || !body.eventType?.trim()) {
    return NextResponse.json({ error: "job and eventType are required." }, { status: 400 });
  }

  // Tracking is best-effort — always return 200 to the client; log failures server-side.
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("job_interactions").insert({
      user_id: userId,
      job_key: toJobKey(body.job),
      source: body.job.source,
      event_type: body.eventType.trim(),
      payload: body.payload ?? {},
    });

    if (error) {
      console.error("[/api/jobs/track] Supabase insert error:", extractErrorMessage(error));
    }
  } catch (err) {
    console.error("[/api/jobs/track] Unexpected error:", extractErrorMessage(err));
  }

  return NextResponse.json({ ok: true });
}

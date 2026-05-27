import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseUser, getSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireSupabaseUser(request);
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();
    if (!id) return NextResponse.json({ error: "Missing resume id." }, { status: 400 });

    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("user_resumes").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete resume.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

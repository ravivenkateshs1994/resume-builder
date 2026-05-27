import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, requireSupabaseUser } from "@/lib/supabase/server";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSupabaseUser(request);
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("user_analysis").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete analysis.";
    const isAuthError = message.includes("bearer") || message.includes("session") || message.includes("token");
    return NextResponse.json({ error: message }, { status: isAuthError ? 401 : 500 });
  }
}

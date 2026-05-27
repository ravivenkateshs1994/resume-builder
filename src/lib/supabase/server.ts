import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || (!anonKey && !serviceRoleKey)) {
    throw new Error(
      "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and either NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return { url, anonKey, serviceRoleKey };
}

export function getSupabaseServerClient() {
  const { url, anonKey, serviceRoleKey } = getEnv();
  // Prefer the service role key for server-side operations when available
  const key = serviceRoleKey ?? anonKey;
  return createClient(url, key as string, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireSupabaseUser(request: NextRequest): Promise<{ id: string; email?: string }> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    if (process.env.DEBUG_SUPABASE_AUTH === "1") console.log("[supabase-auth] missing or invalid auth header:", authHeader);
    throw new Error("Missing bearer token.");
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) throw new Error("Invalid bearer token.");

  const supabase = getSupabaseServerClient();
  if (process.env.DEBUG_SUPABASE_AUTH === "1") console.log("[supabase-auth] verifying token, len=", token.length);
  const { data, error } = await supabase.auth.getUser(token);
  if (process.env.DEBUG_SUPABASE_AUTH === "1") console.log("[supabase-auth] getUser result:", { error: error?.message ?? null, userId: data?.user?.id ?? null, email: data?.user?.email ?? null });
  if (error || !data.user) {
    throw new Error("Invalid or expired session.");
  }

  return { id: data.user.id, email: data.user.email ?? undefined };
}

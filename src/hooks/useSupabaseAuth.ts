"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function useSupabaseAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const supabase = useMemo(() => {
    try {
      return getSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    let mounted = true;

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setAccessToken(data.session?.access_token ?? null);
      setUserEmail(data.session?.user?.email ?? null);
      // Try common metadata fields for full name
      const meta = data.session?.user?.user_metadata as Record<string, any> | undefined;
      const fullName = meta?.full_name ?? meta?.fullName ?? meta?.name ?? null;
      setUserFullName(fullName ?? null);
      setAuthReady(true);
    };

    void syncSession();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccessToken(session?.access_token ?? null);
      setUserEmail(session?.user?.email ?? null);
      const meta = session?.user?.user_metadata as Record<string, any> | undefined;
      const fullName = meta?.full_name ?? meta?.fullName ?? meta?.name ?? null;
      setUserFullName(fullName ?? null);
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const router = useRouter();

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    try {
      // If user is on dashboard, redirect them to home after sign out
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/dashboard")) {
        router.push("/");
      }
    } catch {
      // ignore routing errors
    }
  }

  async function signInWithPassword(email: string, password: string): Promise<string | null> {
    if (!supabase) return "Supabase is not configured.";
    const cleanEmail = email.trim();
    if (!cleanEmail) return "Email is required.";
    if (!password) return "Password is required.";

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    return error ? error.message : null;
  }

  return {
    supabase,
    accessToken,
    userEmail,
    userFullName,
    isLoggedIn: Boolean(accessToken),
    authReady,
    signOut,
    signInWithPassword,
  };
}

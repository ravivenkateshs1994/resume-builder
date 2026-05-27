"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export default function LoginPage() {
  const { isLoggedIn, userEmail, signOut, signInWithPassword, supabase } = useSupabaseAuth();
  const router = useRouter();
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current += 1;
    if (typeof window !== "undefined") {
      console.debug("[diagnostics] LoginPage render", renderCount.current);
    }
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onLogin() {
    setLoading(true);
    setMessage(null);
    const err = await signInWithPassword(email, password);
    setLoading(false);
    if (err) {
      setMessage(err);
      return;
    }
    setMessage("Logged in.");
  }

  useEffect(() => {
    if (isLoggedIn) router.push("/dashboard");
  }, [isLoggedIn, router]);

  return (
    <div className="crp-shell min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Account</p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Admin Login</h1>
          <p className="mt-2 text-sm text-slate-600">Use the single admin account for now. Signup will come later.</p>

          {!supabase && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              Supabase is not configured. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
            </p>
          )}

          {isLoggedIn ? (
            <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm text-emerald-800">Logged in as {userEmail}</p>
              <button
                type="button"
                onClick={() => void signOut()}
                className="mt-3 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="crp-input w-full"
              />
              <input
                ref={passwordRef}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="crp-input w-full"
              />
              <button
                type="button"
                onClick={() => void onLogin()}
                disabled={loading || !email.trim() || !password || !supabase}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>
          )}

          {message && <p className="mt-4 text-sm text-slate-600">{message}</p>}

          <p className="mt-5 text-xs text-slate-500">
            First time setup: seed the admin account with `npm run seed:admin`.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

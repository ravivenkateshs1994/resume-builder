"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export default function LoginPage() {
  const { isLoggedIn, userEmail, signOut, signInWithPassword, supabase } = useSupabaseAuth();
  const router = useRouter();
  // diagnostics removed
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
    <div className="home-shell crp-shell relative isolate min-h-screen">
      <SiteHeader />
      <div aria-hidden="true" className="home-grid-overlay pointer-events-none absolute inset-0 opacity-55" />
      <div aria-hidden="true" className="home-hero-deco pointer-events-none absolute inset-0 opacity-55" />
      <div aria-hidden="true" className="home-hero-scan pointer-events-none absolute inset-0" />
      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-140px)] w-full max-w-5xl items-center px-4 py-12">
        <section className="grid w-full gap-6 rounded-[32px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_34px_80px_-44px_rgba(15,23,42,0.8)] backdrop-blur sm:p-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Account access</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-50 sm:text-4xl">Sign in</h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">
              Sign in to continue your workspace, keep your resume drafts synced, and return to the analysis flow.
            </p>

          {!supabase && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              Supabase is not configured. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
            </p>
          )}

          {isLoggedIn ? (
            <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
              <p className="text-sm text-emerald-100">Logged in as {userEmail}</p>
              <button
                type="button"
                onClick={() => void signOut()}
                className="mt-3 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/15"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <label htmlFor="login-email" className="sr-only">Email</label>
              <input
                id="login-email"
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="crp-input w-full"
              />
              <label htmlFor="login-password" className="sr-only">Password</label>
              <input
                id="login-password"
                ref={passwordRef}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="crp-input w-full"
              />
              <button
                type="button"
                onClick={() => void onLogin()}
                disabled={loading || !email.trim() || !password || !supabase}
                className="crp-btn-primary inline-flex min-h-[44px] items-center justify-center px-4 py-2 text-sm"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          )}

          {message && <p role="status" aria-live="polite" className="mt-4 text-sm text-slate-300">{message}</p>}
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_34px_80px_-46px_rgba(15,23,42,0.68)] sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">Workspace signal</p>
            <div className="mt-4 space-y-3">
              {[
                "Resume drafts stay tied to your account.",
                "Analysis, templates, and job matching follow you across sessions.",
                "Your workspace returns ready to continue, not to restart.",
              ].map((item, index) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                      0{index + 1}
                    </div>
                    <p className="text-sm leading-relaxed text-slate-200">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

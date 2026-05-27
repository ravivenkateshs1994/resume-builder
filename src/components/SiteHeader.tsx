"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MobileNav from "./MobileNav";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useState, useRef, useEffect, memo } from "react";

function SiteHeaderImpl() {
  const pathname = usePathname() ?? "";
  const { isLoggedIn, signOut } = useSupabaseAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const headerRenderCount = useRef(0);
  useEffect(() => {
    headerRenderCount.current += 1;
    if (typeof window !== "undefined") {
      console.debug("[diagnostics] SiteHeader render", headerRenderCount.current);
    }
  });

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const el = profileRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="flex h-16 items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-sm font-bold text-white shadow-sm shadow-indigo-300/40">
              CR
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-900 sm:text-base md:text-lg">Career Readiness</span>
          </Link>

          <div className="flex-1" />

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link
              href="/"
              className={`transition-colors hover:text-indigo-600 ${pathname === "/" ? "text-indigo-600 font-semibold" : ""}`}
            >
              Home
            </Link>
            <Link
              href="/create"
              className={`transition-colors hover:text-indigo-600 ${pathname.startsWith("/create") ? "text-indigo-600 font-semibold" : ""}`}
            >
              Resume Builder
            </Link>
            <Link
              href="/gap-analysis"
              className={`transition-colors hover:text-indigo-600 ${pathname.startsWith("/gap-analysis") ? "text-indigo-600 font-semibold" : ""}`}
            >
              Gap Analysis
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3" ref={profileRef}>
              {isLoggedIn ? (
                <div className="relative">
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={profileOpen}
                    onClick={() => setProfileOpen((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-indigo-600"
                  >
                    My Dashboard
                    <svg className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="none" aria-hidden>
                      <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {profileOpen && (
                    <div role="menu" className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-md border bg-white shadow-lg">
                      <Link
                        href="/dashboard"
                        role="menuitem"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        View Dashboard
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setProfileOpen(false);
                          void signOut();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login" className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:opacity-95">
                  Login
                </Link>
              )}
            </div>
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}

export const SiteHeader = memo(SiteHeaderImpl);

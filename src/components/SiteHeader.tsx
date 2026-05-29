"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import MobileNav from "./MobileNav";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useScrollDepth } from "@/hooks/useScrollDepth";
import { useState, useRef, useEffect, memo } from "react";

function SiteHeaderImpl() {
  const pathname = usePathname() ?? "";
  const { isLoggedIn, signOut } = useSupabaseAuth();
  const { scrolled } = useScrollDepth(18);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  // diagnostics removed

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
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-slate-200/90 bg-white/82 shadow-[0_16px_36px_-24px_rgba(15,23,42,0.28)] backdrop-blur-xl"
          : "border-b border-slate-200/60 bg-white/70 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className={`flex items-center gap-4 transition-all duration-300 ${scrolled ? "h-[60px]" : "h-16"}`}>
          <Link href="/" className="flex items-center gap-2.5" aria-label="Career Readiness">
            <div className={`flex max-w-[140px] items-center transition-transform duration-300 sm:max-w-[220px] ${scrolled ? "scale-[0.96]" : "scale-100"}`}>
              <Image
                src="/career-readiness-desktop-logo.png"
                alt="Career Readiness"
                width={220}
                height={40}
                className={`h-auto max-w-full object-contain transition-all duration-300 ${scrolled ? "max-h-9" : "max-h-10"}`}
                priority
              />
            </div>
            <span className="sr-only">Career Readiness</span>
          </Link>

          <div className="flex-1" />

          <nav className={`hidden md:flex items-center gap-6 text-sm font-medium transition-all duration-300 ${scrolled ? "text-slate-700" : "text-slate-600"}`}>
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
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-300 hover:text-indigo-600 ${
                      scrolled ? "text-slate-800" : "text-slate-700"
                    }`}
                  >
                    My Dashboard
                    <svg className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="none" aria-hidden="true">
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
                <Link href="/login" className={`rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition-all duration-300 hover:opacity-95 ${scrolled ? "shadow-[0_8px_20px_-12px_rgba(79,70,229,0.7)]" : ""}`}>
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

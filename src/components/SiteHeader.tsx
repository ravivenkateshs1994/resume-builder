"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import MobileNav from "./MobileNav";
import { User } from "lucide-react";
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
          ? "border-b border-white/10 bg-slate-950/80 shadow-[0_16px_36px_-24px_rgba(15,23,42,0.82)] backdrop-blur-xl"
          : "border-b border-white/10 bg-slate-950/70 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className={`flex items-center gap-4 transition-all duration-300 h-16 ${scrolled ? "md:h-[60px]" : "md:h-16"}`}>
          <Link href="/" className="flex items-center gap-2.5" aria-label="Career Readiness">
            <div className="flex h-9 max-w-[156px] items-center sm:h-10 sm:max-w-[230px] md:h-8 md:max-w-[184px] lg:max-w-[200px]">
              <Image
                src="/career-readiness-desktop-logo.png"
                alt="Career Readiness"
                width={2172}
                height={724}
                className="h-full w-auto max-w-full object-contain transition-all duration-300"
                priority
              />
            </div>
            <span className="sr-only">Career Readiness</span>
          </Link>

          <div className="flex-1" />

          <nav aria-label="Main navigation" className={`hidden md:flex items-center gap-6 text-sm font-medium transition-all duration-300 ${scrolled ? "text-slate-200" : "text-slate-300"}`}>
            <Link
              href="/"
              className={`rounded-md px-1 py-1 transition-colors hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${pathname === "/" ? "text-cyan-200 font-semibold" : ""}`}
            >
              Home
            </Link>
            <Link
              href="/create"
              className={`rounded-md px-1 py-1 transition-colors hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${pathname.startsWith("/create") ? "text-cyan-200 font-semibold" : ""}`}
            >
              Resume Builder
            </Link>
            <Link
              href="/jobs"
              className={`rounded-md px-1 py-1 transition-colors hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${pathname.startsWith("/jobs") ? "text-cyan-200 font-semibold" : ""}`}
            >
              Jobs
            </Link>
            <Link
              href="/gap-analysis"
              className={`rounded-md px-1 py-1 transition-colors hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${pathname.startsWith("/gap-analysis") ? "text-cyan-200 font-semibold" : ""}`}
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
                    aria-controls="profile-menu"
                    aria-label={profileOpen ? "Close profile menu" : "Open profile menu"}
                    onClick={() => setProfileOpen((v) => !v)}
                    className={`inline-flex items-center justify-center rounded-full p-2 text-sm font-medium transition-all duration-300 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                      scrolled ? "text-slate-200" : "text-slate-300"
                    }`}
                  >
                    <User className="h-5 w-5 text-slate-300" aria-hidden="true" />
                  </button>

                  {profileOpen && (
                    <div id="profile-menu" role="menu" aria-label="User account menu" className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-lg">
                      <Link
                        href="/dashboard"
                        role="menuitem"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
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
                        className="w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-white/5"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login" className={`rounded-md bg-gradient-to-r from-cyan-400 to-violet-500 px-3 py-1.5 text-sm font-semibold text-slate-950 transition-all duration-300 hover:opacity-95 ${scrolled ? "shadow-[0_8px_20px_-12px_rgba(34,211,238,0.7)]" : ""}`}>
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

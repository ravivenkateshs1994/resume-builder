"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MobileNav from "./MobileNav";

export function SiteHeader() {
  const pathname = usePathname();

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
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}

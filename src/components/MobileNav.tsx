"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Resume Builder", href: "/create" },
  { label: "Gap Analysis", href: "/gap-analysis" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname() ?? "";

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => { setOpen(false); }, [pathname]);

  const overlay = (
    <div
      style={{ backgroundColor: "#ffffff", position: "fixed", inset: 0, zIndex: 99999 }}
      className={`flex flex-col md:hidden transition-opacity duration-300 ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      {/* Top bar */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-500 text-xs font-bold text-white">
            CR
          </div>
          <span className="text-sm font-bold tracking-wide text-slate-900">Career Readiness</span>
        </div>
        {/* Close button inside overlay */}
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="flex h-10 w-10 flex-col items-center justify-center gap-[5px]"
        >
          <span className="block h-[1.5px] w-5 bg-slate-800 origin-center translate-y-[6.5px] rotate-45" />
          <span className="block h-[1.5px] w-5 bg-slate-800 opacity-0" />
          <span className="block h-[1.5px] w-5 bg-slate-800 origin-center -translate-y-[6.5px] -rotate-45" />
        </button>
      </div>

      {/* Nav links — centered vertically */}
      <nav className="flex flex-1 flex-col justify-center px-8 gap-1">
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`rounded-xl px-5 py-4 text-base font-semibold tracking-wide transition-colors ${
                active
                  ? "bg-indigo-600 text-white"
                  : "text-slate-800 hover:bg-slate-100"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <p className="shrink-0 pb-8 text-center text-xs text-slate-400">AI Career Readiness Platform</p>
    </div>
  );

  return (
    <>
      {/* Hamburger button */}
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 flex-col items-center justify-center gap-[5px] md:hidden"
        style={{ zIndex: 100000 }}
      >
        <span className={`block h-[1.5px] w-5 bg-slate-800 origin-center transition-all duration-250 ease-in-out ${open ? "translate-y-[6.5px] rotate-45" : ""}`} />
        <span className={`block h-[1.5px] w-5 bg-slate-800 transition-all duration-250 ease-in-out ${open ? "opacity-0" : ""}`} />
        <span className={`block h-[1.5px] w-5 bg-slate-800 origin-center transition-all duration-250 ease-in-out ${open ? "-translate-y-[6.5px] -rotate-45" : ""}`} />
      </button>

      {/* Portal: renders outside any stacking context */}
      {mounted && createPortal(overlay, document.body)}
    </>
  );
}

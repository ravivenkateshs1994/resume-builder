"use client";

import { useState, useEffect, useRef } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Resume Builder", href: "/create" },
  { label: "Gap Analysis", href: "/gap-analysis" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isLoggedIn, userEmail, userFullName, signOut } = useSupabaseAuth();
  const pathname = usePathname() ?? "";
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;

    const node = overlayRef.current;
    if (node) {
      const focusable = Array.from(node.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ));
      if (focusable.length) focusable[0].focus();
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "Tab") {
        const node = overlayRef.current;
        if (!node) return;
        const focusable = Array.from(node.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter(Boolean);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => { setOpen(false); }, [pathname]);

  const overlay = (
    <div
      ref={overlayRef}
      style={{ backgroundColor: "#ffffff", position: "fixed", inset: 0, zIndex: 99999 }}
      className={`flex flex-col md:hidden transition-opacity duration-300 ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!open}
      role="dialog"
      aria-modal={open}
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
          ref={(el) => el?.focus()}
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-100"
        >
          <svg className="h-4 w-4 text-slate-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
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

      <div className="shrink-0 px-6 pb-8">
        {isLoggedIn ? (
            <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="text-sm text-slate-700">Signed in as</div>
            <div className="mb-3 truncate text-sm font-medium text-slate-900">{userFullName ?? userEmail ?? "Account"}</div>
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="block w-full rounded-xl bg-indigo-600 px-4 py-3 text-center font-semibold text-white"
            >
              My Dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void signOut();
              }}
              className="mt-2 block w-full rounded-xl border border-slate-200 px-4 py-3 text-center font-medium text-slate-700"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="block w-full rounded-xl bg-indigo-600 px-4 py-3 text-center font-semibold text-white"
            >
              Login
            </Link>
          </div>
        )}

        <p className="mt-4 text-center text-xs text-slate-400">Career Readiness Platform</p>
      </div>
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
        className="relative flex h-10 w-10 items-center justify-center md:hidden"
        style={{ zIndex: 100000 }}
      >
        <Menu className="h-5 w-5 text-slate-800" />
      </button>

      {/* Portal: renders outside any stacking context */}
      {mounted && createPortal(overlay, document.body)}
    </>
  );
}

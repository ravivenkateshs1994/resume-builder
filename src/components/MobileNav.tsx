"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Resume Builder", href: "/create" },
  { label: "Jobs", href: "/jobs" },
  { label: "Gap Analysis", href: "/gap-analysis" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isLoggedIn, userEmail, userFullName, signOut } = useSupabaseAuth();
  const pathname = usePathname() ?? "";
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;

    if (!lastFocusedRef.current) {
      lastFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }

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

  const closeMenu = () => {
    setOpen(false);
    requestAnimationFrame(() => {
      lastFocusedRef.current?.focus();
      if (menuButtonRef.current) menuButtonRef.current.focus();
    });
  };

  const overlay = (
    <div
      ref={overlayRef}
      id="mobile-navigation-panel"
      style={{ backgroundColor: "#06141d", position: "fixed", inset: 0, zIndex: 99999 }}
      className={`flex flex-col md:hidden transition-opacity duration-300 ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!open}
      role="dialog"
      aria-modal={open}
      aria-label="Site navigation"
    >
      {/* Top bar */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-slate-950/80 px-4 md:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 max-w-[156px] items-center sm:h-10 sm:max-w-[200px]">
            <Image
              src="/career-readiness-desktop-logo.png"
              alt="Career Readiness"
              width={2172}
              height={724}
              className="h-full w-auto max-w-full object-contain"
              priority
            />
          </div>
        </div>
        {/* Close button inside overlay */}
        <button
          ref={(el) => el?.focus()}
          type="button"
          aria-label="Close menu"
          onClick={closeMenu}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          <svg className="h-4 w-4 text-slate-200" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
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
              onClick={closeMenu}
              className={`rounded-xl px-5 py-4 text-base font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                active
                  ? "bg-cyan-400/15 text-cyan-100 border border-cyan-300/40"
                  : "text-slate-200 hover:bg-white/10"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 px-6 pb-8">
        {isLoggedIn ? (
            <div className="mt-4 border-t border-white/10 pt-4">
            <div className="text-sm text-slate-300">Signed in as</div>
            <div className="mb-3 truncate text-sm font-medium text-slate-100">{userFullName ?? userEmail ?? "Account"}</div>
            <Link
              href="/dashboard"
              onClick={closeMenu}
              className="block w-full rounded-xl bg-indigo-600 px-4 py-3 text-center font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              My Dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                closeMenu();
                void signOut();
              }}
              className="mt-2 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center font-medium text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="mt-4 border-t border-white/10 pt-4">
            <Link
              href="/login"
              onClick={closeMenu}
              className="block w-full rounded-xl bg-indigo-600 px-4 py-3 text-center font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
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
        ref={menuButtonRef}
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-navigation-panel"
        onClick={() => {
          if (open) {
            closeMenu();
            return;
          }
          lastFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          setOpen(true);
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-md md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        style={{ zIndex: 100000 }}
      >
        <Menu className="h-5 w-5 text-slate-200" aria-hidden="true" />
      </button>

      {/* Portal: renders outside any stacking context */}
      {mounted && createPortal(overlay, document.body)}
    </>
  );
}

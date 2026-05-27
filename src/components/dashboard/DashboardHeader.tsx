"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useState, useRef, useEffect } from "react";

const NAV = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Resumes", href: "/dashboard" },
  { label: "Gap Analysis", href: "/gap-analysis" },
  { label: "Insights", href: "/dashboard" },
];

export default function DashboardHeader() {
  const pathname = usePathname() ?? "";
  const { isLoggedIn, userEmail, userFullName, signOut } = useSupabaseAuth();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && e.target instanceof Node && !ref.current.contains(e.target)) setOpen(false);
      if (notifRef.current && e.target instanceof Node && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const initials = (userFullName
    ? userFullName.trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join("")
    : (userEmail ? userEmail.slice(0, 1) : "?"))
    .toUpperCase();
  const displayName = userFullName ?? (userEmail ? userEmail.split("@")[0] : "Account");

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 md:px-6">

        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-sm font-extrabold text-white shadow-sm">
            CR
          </div>
          <span className="hidden text-sm font-bold tracking-tight text-slate-900 sm:block">
            Career Readiness
          </span>
        </Link>

        {/* Nav */}
        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV.map(({ label, href }) => {
            const active =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <Link
                key={label}
                href={href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">

          {/* Notification bell */}
          <div className="relative" ref={notifRef}>
            <button
              title="Notifications"
              onClick={() => setNotifOpen(v => !v)}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118.5 14.5V11a6.5 6.5 0 10-13 0v3.5c0 .538-.214 1.055-.595 1.436L3 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {/* Unread dot */}
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-white" />
            </button>

            {notifOpen && (
              <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border bg-white shadow-xl">
                <div className="border-b px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Notifications</p>
                </div>
                <div className="px-4 py-6 text-center text-sm text-slate-500">
                  You&apos;re all caught up 🎉
                </div>
              </div>
            )}
          </div>

          {/* User avatar */}
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen(v => !v)}
              aria-haspopup="menu"
              aria-expanded={open}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-xs font-bold text-white">
                {initials}
              </div>
              <span className="hidden max-w-[120px] truncate md:inline">{displayName}</span>
              <svg className="h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {open && (
              <div role="menu" className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border bg-white shadow-xl">
                <div className="border-b px-4 py-3">
                  <p className="truncate text-xs font-semibold text-slate-900">{userFullName ?? userEmail ?? "Account"}</p>
                </div>
                <Link href="/dashboard" role="menuitem" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  View Dashboard
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setOpen(false); void signOut(); }}
                  className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

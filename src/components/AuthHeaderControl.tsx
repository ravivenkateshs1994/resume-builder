"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export default function AuthHeaderControl() {
  const { userEmail, isLoggedIn, signOut, authReady } = useSupabaseAuth();
  const pathname = usePathname() ?? "";
  const loginActive = pathname.startsWith("/login");
  const [open, setOpen] = useState(false); 

  if (!authReady) {
    return <span className="text-sm font-medium text-slate-400">Auth...</span>;
  }

  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        className={`text-sm font-medium transition-colors hover:text-indigo-600 ${
          loginActive ? "text-indigo-600 font-semibold" : "text-slate-600"
        }`}
      >
        Login
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="text-sm font-medium text-slate-600 transition-colors hover:text-indigo-600"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        My Dashboard
      </button>
      {open && <ProfileDropdown onClose={() => setOpen(false)} signOut={signOut} />}
    </div>
  );
}

function ProfileDropdown({ onClose, signOut }: { onClose: () => void; signOut: () => Promise<void> | void }) {
  // auto-close dropdown after 8s for privacy
  useEffect(() => {
    const t = setTimeout(() => onClose(), 8000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="absolute right-0 mt-2 w-40 rounded-md border bg-white shadow-lg">
      <ul className="py-1 text-sm text-slate-700">
        <li>
          <Link href="/dashboard" className="block px-3 py-2 hover:bg-slate-50" onClick={onClose}>
            View Dashboard
          </Link>
        </li>
        <li>
          <button
            type="button"
            className="w-full text-left block px-3 py-2 hover:bg-slate-50"
            onClick={() => {
              onClose();
              void signOut();
            }}
          >
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
}



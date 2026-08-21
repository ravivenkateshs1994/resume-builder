import Link from "next/link";
import { ArrowRight, FileSearch, Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="crp-shell flex min-h-screen items-center px-6 py-16 text-slate-100">
      <div className="mx-auto grid w-full max-w-5xl gap-8 rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.45)] lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:p-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-200">
            <FileSearch className="h-3.5 w-3.5" />
            Page not found
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            This page wandered off the map.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
            The route you tried does not exist here, but the rest of the workspace is ready when you are.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Quick actions</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link href="/" className="crp-btn-primary inline-flex items-center justify-center gap-2 px-4 py-3 text-sm">
              <Home className="h-4 w-4" />
              Go home
            </Link>
            <Link href="/create" className="crp-btn-secondary inline-flex items-center justify-center gap-2 px-4 py-3 text-sm">
              <ArrowRight className="h-4 w-4" />
              Start a scan
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

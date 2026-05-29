"use client";

import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:py-16">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Brand Section */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2.5" aria-label="Career Readiness">
              <div className="flex h-9 max-w-[140px] items-center sm:h-10 sm:max-w-[220px]">
                <Image
                  src="/career-readiness-desktop-logo.png"
                  alt="Career Readiness"
                  width={220}
                  height={40}
                  className="h-auto max-h-full w-auto max-w-full object-contain"
                />
              </div>
              <span className="sr-only">Career Readiness</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-slate-500">
              Your career execution workspace for role-targeted resumes, skill-gap intelligence, and interview readiness.
            </p>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
              Analyze. Prioritize. Improve. Repeat.
            </p>
          </div>

          <div className="mt-12 xl:col-span-2 xl:mt-0">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Platform</h3>
                <ul className="mt-4 space-y-3">
                  <li>
                    <Link href="/create" className="text-sm text-slate-500 hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5">
                      Resume Builder
                    </Link>
                  </li>
                  <li>
                    <Link href="/gap-analysis" className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">
                      Gap Analysis
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard" className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">
                      Career Dashboard
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Use Cases</h3>
                <ul className="mt-4 space-y-3">
                  <li className="text-sm text-slate-500">Students and Freshers</li>
                  <li className="text-sm text-slate-500">Career Switchers</li>
                  <li className="text-sm text-slate-500">Experienced Professionals</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Legal</h3>
                <ul className="mt-4 space-y-3">
                  <li>
                    <Link href="/privacy" className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-600">
            &copy; {currentYear} Career Readiness Platform. Built for high-intent job seekers.
          </p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
              Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

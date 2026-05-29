"use client";

import Link from "next/link";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:py-16">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Brand Section */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2.5" aria-label="Career Readiness">
            <div className="h-9 sm:h-10 max-w-[140px] sm:max-w-[220px] flex items-center">
              <img
                src="/career-readiness-desktop-logo.png"
                alt="Career Readiness"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <span className="sr-only">Career Readiness</span>
          </Link>
            <p className="max-w-xs text-sm leading-relaxed text-slate-500">
              The AI-powered platform designed to help you land your dream role with tailored resumes and deep skill-gap analysis.
            </p>
          </div>

          <div className="mt-12 xl:col-span-2 xl:mt-0">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Product</h3>
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
                </ul>
              </div>
              <div className="">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Company</h3>
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
            &copy; {currentYear} Career Readiness Platform. All rights reserved.
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

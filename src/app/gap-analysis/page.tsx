"use client";

import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";
import { useResumeStore } from "@/store/resumeStore";

export default function GapAnalysisPage() {
  const { resumeData } = useResumeStore();
  const hasBuilderResume = Boolean(resumeData && Object.keys(resumeData).length > 0 && resumeData.personalInfo?.fullName !== "");
  const activeName = resumeData.personalInfo?.fullName || "your resume";

  return (
    <main className="min-h-screen crp-shell">
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-blue-100/60 blur-3xl" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-sky-100/60 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-6 pb-16 pt-20 text-center sm:pt-24">
          <span className="inline-flex items-center gap-2 bg-white border border-blue-100 text-blue-700 text-xs font-semibold px-4 py-1.5 rounded-full shadow-sm mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Career Intelligence
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.08] tracking-tight">Gap Analysis</h1>
          <p className="text-xl text-slate-500 mt-6 max-w-2xl mx-auto leading-relaxed">Compare your profile against a target role and discover what is missing.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link href="/gap-analysis/analysis" className="crp-btn-primary px-8 py-4 rounded-2xl text-lg font-semibold group transition-all hover:scale-[1.02]">
              <span className="inline-flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Start Analysis
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link href="/create" className="crp-btn-secondary px-8 py-4 rounded-2xl text-lg">Resume Tailoring</Link>
          </div>
          <p className="text-xs text-slate-400 mt-5">PDF and DOCX supported | no sign-up required | import your own resume or keep {hasBuilderResume ? "using " + activeName : "the in-app draft"}</p>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl font-extrabold text-slate-900">PDF/DOCX</p>
            <p className="text-sm text-slate-500 mt-0.5">Existing resume import</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-slate-900">ATS</p>
            <p className="text-sm text-slate-500 mt-0.5">Scoring engine</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-slate-900">3</p>
            <p className="text-sm text-slate-500 mt-0.5">Gap priority levels</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-slate-900">Links</p>
            <p className="text-sm text-slate-500 mt-0.5">Learning resources</p>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">Simple process</p>
            <h2 className="text-4xl font-extrabold text-slate-900">Three moves, one clear outcome</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm mb-4`}>01</div>
              <h3 className="font-bold text-slate-800 mb-1.5">Bring your resume</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Upload a PDF or DOCX resume, or keep using the resume you built in the app.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm mb-4`}>02</div>
              <h3 className="font-bold text-slate-800 mb-1.5">Paste the job</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Drop in the full job description and let the analyzer extract the signals.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm mb-4`}>03</div>
              <h3 className="font-bold text-slate-800 mb-1.5">Act on the gaps</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Review your match score, missing keywords, and the fastest learning path.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}





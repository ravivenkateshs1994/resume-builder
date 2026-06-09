"use client";

import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Lock, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useResumeStore } from "@/store/resumeStore";
import { JobFeedPanel } from "@/components/jobs/JobFeedPanel";
import { getJobFeedSubtitle, getJobFeedTitle } from "@/lib/personalization";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export default function JobsPage() {
  const { isLoggedIn, authReady } = useSupabaseAuth();
  const careerStage = useResumeStore((s) => s.careerStage);
  const resumeData = useResumeStore((s) => s.resumeData);
  const hasResume = Boolean(resumeData.personalInfo.fullName || resumeData.skills.length || resumeData.workExperience.length);
  const resumeLocation = resumeData.personalInfo.location.trim();
  const feedTitle = getJobFeedTitle(careerStage);
  const feedSubtitle = getJobFeedSubtitle(careerStage);

  // Auth gate — show a sign-in prompt until auth state is resolved
  if (authReady && !isLoggedIn) {
    return (
      <div className="crp-shell min-h-screen overflow-x-hidden text-sm md:text-base">
        <SiteHeader />
        <main className="mx-auto flex min-h-[calc(100vh-140px)] w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
              <Lock className="h-7 w-7 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Sign in to view jobs</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Job listings are personalised to your resume and career stage. Sign in to unlock your matched feed.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link href="/login" className="crp-btn-primary inline-flex w-full items-center justify-center gap-2 px-6 py-3 text-sm">
                Sign in
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/" className="crp-btn-secondary inline-flex w-full items-center justify-center gap-2 px-6 py-3 text-sm">
                Back to home
              </Link>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="crp-shell min-h-screen overflow-x-hidden text-sm md:text-base">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <ScrollReveal delayMs={40}>
          <section className="overflow-hidden rounded-[36px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_28%),linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] p-6 shadow-[0_28px_80px_-48px_rgba(15,23,42,0.32)] md:p-8 lg:p-10">
            <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
              <div>
                <span className="crp-badge inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Role-aware job feed
                </span>
                <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                  {feedTitle}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
                  {feedSubtitle}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/create" className="crp-btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm">
                    Improve resume
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/gap-analysis/analysis" className="crp-btn-secondary inline-flex items-center gap-2 px-6 py-3 text-sm">
                    Tailor against a job
                  </Link>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5">
                    <BriefcaseBusiness className="h-4 w-4 text-indigo-600" />
                    {careerStage === "FRESHER" ? "Internships and entry roles first" : "Full-time roles first"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5">
                    <BriefcaseBusiness className="h-4 w-4 text-indigo-600" />
                    Resume match scoring
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5">
                    <BriefcaseBusiness className="h-4 w-4 text-indigo-600" />
                    Save and tailor in one click
                  </span>
                </div>
              </div>

              <div className="rounded-[30px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_34px_80px_-46px_rgba(15,23,42,0.68)] md:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">Profile snapshot</p>
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Current stage</p>
                    <p className="mt-2 text-lg font-semibold text-white">{careerStage === "FRESHER" ? "Fresher" : "Experienced"}</p>
                    <p className="mt-1 text-sm text-slate-300">
                      {hasResume
                        ? "Your current resume data is being used to rank listings."
                        : "Build or import a resume to get sharper recommendations."}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { label: "Match type", value: "Skills + stage" },
                      { label: "Actions", value: "Save or tailor" },
                      { label: "Best fit", value: careerStage === "FRESHER" ? "Internship-first" : "Career-move first" },
                      { label: "Refresh", value: "Live fetch" },
                      { label: "Location", value: resumeLocation || "Enter in feed" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                        <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        <div className="mt-6">
          <JobFeedPanel compact={false} showSearch limit={8} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

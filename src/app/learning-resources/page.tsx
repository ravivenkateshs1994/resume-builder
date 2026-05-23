"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ResourceType = "Documentation" | "Tutorial" | "Course" | "Article" | "Video";
type ResourceGroup = "Immediate Skills" | "Recommended Next" | "Advanced Learning";

type ResourceItem = {
  id: string;
  skill: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedTime: string;
  type: ResourceType;
  title: string;
  url: string;
  group: ResourceGroup;
};

const resources: ResourceItem[] = [
  {
    id: "react-performance-docs",
    skill: "React Performance",
    difficulty: "Intermediate",
    estimatedTime: "2h",
    type: "Documentation",
    title: "React Optimization Guide",
    url: "https://react.dev/learn",
    group: "Immediate Skills",
  },
  {
    id: "next-routing-tutorial",
    skill: "Next.js Routing",
    difficulty: "Beginner",
    estimatedTime: "90m",
    type: "Tutorial",
    title: "Next.js App Router Tutorial",
    url: "https://nextjs.org/learn",
    group: "Immediate Skills",
  },
  {
    id: "typescript-systems-course",
    skill: "TypeScript",
    difficulty: "Intermediate",
    estimatedTime: "4h",
    type: "Course",
    title: "Advanced TypeScript Patterns",
    url: "https://www.typescriptlang.org/docs/",
    group: "Recommended Next",
  },
  {
    id: "ats-keyword-article",
    skill: "ATS Keyword Strategy",
    difficulty: "Beginner",
    estimatedTime: "40m",
    type: "Article",
    title: "Practical ATS Keyword Optimization",
    url: "https://www.indeed.com/career-advice/resumes-cover-letters/ats-resume",
    group: "Recommended Next",
  },
  {
    id: "system-design-video",
    skill: "System Design",
    difficulty: "Advanced",
    estimatedTime: "3h",
    type: "Video",
    title: "System Design Interview Deep Dive",
    url: "https://www.youtube.com/results?search_query=system+design+interview",
    group: "Advanced Learning",
  },
  {
    id: "behavioral-docs",
    skill: "Behavioral Interviewing",
    difficulty: "Intermediate",
    estimatedTime: "75m",
    type: "Documentation",
    title: "STAR Framework Playbook",
    url: "https://www.themuse.com/advice/star-interview-method",
    group: "Advanced Learning",
  },
];

const typeBadgeClasses: Record<ResourceType, string> = {
  Documentation: "bg-slate-100 text-slate-700 border-slate-200",
  Tutorial: "bg-cyan-100 text-cyan-700 border-cyan-200",
  Course: "bg-indigo-100 text-indigo-700 border-indigo-200",
  Article: "bg-blue-100 text-blue-700 border-blue-200",
  Video: "bg-amber-100 text-amber-700 border-amber-200",
};

function AppHeader() {
  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold text-[11px]">
            CR
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">Career Readiness Platform</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-slate-600 font-medium">
          <Link href="/" className="crp-nav-link">Home</Link>
          <Link href="/create" className="crp-nav-link">Resume Tailoring</Link>
          <Link href="/gap-analysis" className="crp-nav-link">Gap Analysis</Link>
        </nav>
      </div>
    </header>
  );
}

export default function LearningResourcesPage() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  const grouped = useMemo(() => {
    const groups: Record<ResourceGroup, ResourceItem[]> = {
      "Immediate Skills": [],
      "Recommended Next": [],
      "Advanced Learning": [],
    };
    for (const item of resources) groups[item.group].push(item);
    return groups;
  }, []);

  const completedCount = Object.values(completed).filter(Boolean).length;

  return (
    <main className="min-h-screen crp-shell">
      <AppHeader />

      <section className="max-w-6xl mx-auto px-6 pt-10 pb-6">
        <div className="crp-card crp-module-accent crp-soft-radial p-6 sm:p-7">
          <span className="crp-badge">Learning Roadmap</span>
          <h1 className="crp-section-title mt-3">Learning Roadmap</h1>
          <p className="crp-section-copy mt-2 max-w-3xl">
            Resources selected based on your missing skills.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">Completion tracking</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">Grouped learning path</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">Role-focused resources</span>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-6">
        <div className="crp-card-soft crp-glass crp-module-accent p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm font-semibold text-slate-800">Progress</p>
            <span className="text-xs font-semibold text-slate-600">{completedCount}/{resources.length} completed</span>
          </div>
          <div className="mt-3 crp-score-meter h-2.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500"
              style={{ width: `${(completedCount / resources.length) * 100}%` }}
            />
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-16 space-y-6">
        {(Object.keys(grouped) as ResourceGroup[]).map((groupName) => (
          <div key={groupName} className="crp-card crp-module-accent p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-slate-900">{groupName}</h2>
              <span className="crp-badge">{grouped[groupName].length} resources</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {grouped[groupName].map((resource) => (
                <article key={resource.id} className="crp-score-card p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-slate-900">{resource.skill}</p>
                    <span className={`text-[10px] font-semibold border rounded-full px-2 py-0.5 ${typeBadgeClasses[resource.type]}`}>
                      {resource.type}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mb-3">{resource.title}</p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] mb-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-slate-600">
                      <p className="font-semibold text-slate-500">Difficulty</p>
                      <p className="mt-0.5">{resource.difficulty}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-slate-600">
                      <p className="font-semibold text-slate-500">Estimated Time</p>
                      <p className="mt-0.5">{resource.estimatedTime}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="crp-btn-primary text-xs px-3 py-2"
                    >
                      Open Resource
                    </a>
                    <button
                      type="button"
                      onClick={() => setCompleted((prev) => ({ ...prev, [resource.id]: !prev[resource.id] }))}
                      className="crp-btn-secondary text-xs px-3 py-2"
                    >
                      {completed[resource.id] ? "Completed" : "Mark Done"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section id="roadmap" className="max-w-6xl mx-auto px-6 pb-16">
        <div className="crp-card-soft crp-glass crp-module-accent p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-slate-900">Coming Soon</h2>
            <span className="crp-badge">Roadmap</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              { title: "Mock Interviews", desc: "Practice role-specific interviews generated from your profile and target role." },
              { title: "Interview Question Generator", desc: "Generate likely interview questions from JD requirements and gaps." },
              { title: "AI Interview Feedback", desc: "Get feedback on communication quality, confidence, and technical depth." },
              { title: "Personalized Study Plans", desc: "Build weekly plans from your selected role and missing skills." },
            ].map((item) => (
              <article key={item.title} className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}


import Link from "next/link";
import {
  BookOpenCheck,
  Bot,
  CheckSquare,
  Gauge,
  GraduationCap,
  LineChart,
  Radar,
  Sparkles,
  Target,
} from "lucide-react";

const mvpFeatures = [
  {
    icon: Sparkles,
    title: "Resume Tailoring",
    description:
      "Customize your resume for a specific job description using AI-powered recommendations and ATS-focused improvements.",
  },
  {
    icon: Target,
    title: "JD Match Analysis",
    description:
      "Compare your resume against a target role and identify missing skills, technologies, keywords, and experience areas.",
  },
  {
    icon: LineChart,
    title: "Skill Gap Insights",
    description:
      "Understand exactly what is preventing a stronger match and prioritize the skills that matter most.",
  },
  {
    icon: GraduationCap,
    title: "Learning Roadmap",
    description:
      "Receive curated documentation, tutorials, articles, and learning resources based on identified skill gaps.",
  },
  {
    icon: CheckSquare,
    title: "ATS Optimization",
    description:
      "Improve resume structure, keyword relevance, and recruiter visibility with actionable recommendations.",
  },
  {
    icon: Gauge,
    title: "Career Readiness Score",
    description:
      "Get an overall readiness score showing how closely your profile aligns with the selected role.",
  },
];

const roadmapFeatures = [
  {
    icon: Bot,
    title: "Mock Interviews",
    description:
      "Practice role-specific interviews generated from your resume and target job description.",
  },
  {
    icon: Radar,
    title: "AI Interview Feedback",
    description:
      "Receive detailed feedback on technical accuracy, communication, and confidence.",
  },
  {
    icon: BookOpenCheck,
    title: "Personalized Preparation Plans",
    description:
      "Get structured learning and interview preparation plans tailored to your target role.",
  },
  {
    icon: Target,
    title: "Question Bank Generator",
    description:
      "Generate likely interview questions from job descriptions and required skills.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-sm font-bold text-white shadow-sm shadow-indigo-300/40">
              CR
            </div>
            <span className="text-sm font-bold tracking-wide sm:text-base">Career Readiness Platform</span>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#home" className="crp-nav-link crp-nav-link-active">Home</a>
            <Link href="/create" className="crp-nav-link">Resume Tailoring</Link>
            <Link href="/gap-analysis" className="crp-nav-link">Gap Analysis</Link>
            <Link href="/learning-resources" className="crp-nav-link">Learning Resources</Link>
            <a href="#roadmap" className="crp-nav-link">Roadmap</a>
          </nav>
        </div>
      </header>

      <section id="home" className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />
          <div className="absolute right-0 top-8 h-80 w-80 rounded-full bg-indigo-200/45 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-6 pb-20 pt-20 text-center sm:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Career Intelligence
          </span>

          <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Become Job-Ready for Any Role
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Upload your resume, paste a job description, and receive personalized resume improvements, skill-gap analysis, and a learning roadmap.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/create"
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-300/35 transition-all hover:from-indigo-700 hover:to-cyan-600"
            >
              Analyze My Resume
            </Link>
            <a
              href="#mvp-features"
              className="rounded-xl border border-slate-300 bg-white px-7 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400"
            >
              Explore Features
            </a>
          </div>
        </div>
      </section>

      <section id="mvp-features" className="mx-auto w-full max-w-7xl px-6 pb-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Current Platform Capabilities</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">MVP Features</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {mvpFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)] transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-[0_24px_55px_-30px_rgba(79,70,229,0.35)]"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="learning-resources" className="mx-auto w-full max-w-7xl px-6 pb-16">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-white to-indigo-50 p-8 shadow-[0_20px_60px_-36px_rgba(30,41,59,0.45)]">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Learning Resources</p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight">From gaps to growth, faster</h3>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
            The platform maps missing capabilities to practical resources so users can build a focused plan and become interview-ready for their target role.
          </p>
        </div>
      </section>

      <section id="roadmap" className="mx-auto w-full max-w-7xl px-6 pb-24">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Future Roadmap</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">What&apos;s Coming Next</h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {roadmapFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-6 shadow-[0_14px_35px_-26px_rgba(15,23,42,0.45)]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                    Coming Soon
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}


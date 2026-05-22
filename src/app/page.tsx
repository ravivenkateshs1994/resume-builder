import Link from "next/link";

const features = [
  {
    icon: "🔍",
    title: "Gap Analyzer",
    desc: "Compare your resume to any job description and instantly see what's missing — with a personalised learning plan for each gap.",
  },
  {
    icon: "✨",
    title: "AI-Powered Writing",
    desc: "AI writes polished bullet points and a professional summary from your raw notes — no blank-page stress.",
  },
  {
    icon: "📄",
    title: "Import Your Resume",
    desc: "Upload an existing PDF or Word file and your information is automatically extracted and ready to edit.",
  },
  {
    icon: "🎯",
    title: "ATS Optimisation",
    desc: "Paste a job description and receive a tailored resume with aligned keywords and a real-time match score.",
  },
  {
    icon: "🎨",
    title: "Professional Templates",
    desc: "12 carefully designed templates — from clean and minimal to bold and creative — ready to impress any recruiter.",
  },
  {
    icon: "📥",
    title: "PDF & Word Export",
    desc: "Download your finished resume as a PDF or Word document, formatted and ready to submit.",
  },
];

const steps = [
  { num: "01", label: "Add your details", desc: "Work history, education, and skills — guided step by step.", color: "from-violet-500 to-purple-600" },
  { num: "02", label: "AI writes the content", desc: "Professional bullets, a strong summary, and ATS keywords — generated instantly.", color: "from-sky-500 to-blue-600" },
  { num: "03", label: "Choose a template", desc: "Pick from 12 modern designs built to stand out.", color: "from-teal-500 to-emerald-600" },
  { num: "04", label: "Download & apply", desc: "Export as PDF or Word and send with confidence.", color: "from-orange-500 to-amber-600" },
];

const stats = [
  { value: "12", label: "Resume Templates" },
  { value: "ATS", label: "Keyword Optimisation" },
  { value: "2", label: "Export Formats" },
  { value: "0", label: "Account Required" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f8f9fc]">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">R</div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">ResumeAI</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-slate-600 font-medium">
            <Link href="/gap-analysis" className="hover:text-slate-900 transition-colors">Gap Analyzer</Link>
            <Link href="/create" className="hover:text-slate-900 transition-colors">Builder</Link>
          </nav>
          <Link href="/create" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-md shadow-violet-200">
            Get Started Free
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-violet-100/60 blur-3xl" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-sky-100/60 blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
          <span className="inline-flex items-center gap-2 bg-white border border-violet-100 text-violet-700 text-xs font-semibold px-4 py-1.5 rounded-full shadow-sm mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            AI-Powered Career Tools
          </span>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-[1.08] tracking-tight">
            A resume that{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-500 to-sky-500">gets you hired</span>
              <span aria-hidden className="absolute bottom-1 left-0 w-full h-3 bg-violet-100 rounded-full -z-0" />
            </span>
          </h1>
          <p className="text-xl text-slate-500 mt-6 max-w-2xl mx-auto leading-relaxed">
            Build a job-winning resume in minutes. AI writes the content, you choose the design, and a built-in gap analyzer tells you exactly what skills to highlight.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link href="/create" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all shadow-xl shadow-violet-200">
              Build My Resume →
            </Link>
            <Link href="/gap-analysis" className="border-2 border-slate-200 bg-white hover:border-slate-300 text-slate-700 px-8 py-4 rounded-2xl text-lg font-semibold transition-colors">
              🔍 Analyse My Gaps
            </Link>
          </div>
          <p className="text-xs text-slate-400 mt-5">No sign-up required · Free to use · Export anytime</p>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-slate-100 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-3">Simple process</p>
            <h2 className="text-4xl font-extrabold text-slate-900">Ready in four steps</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.num} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white font-bold text-sm mb-4`}>
                  {s.num}
                </div>
                <h3 className="font-bold text-slate-800 mb-1.5">{s.label}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6 bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-3">Everything you need</p>
            <h2 className="text-4xl font-extrabold text-slate-900">Built for job seekers</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl p-6 border border-slate-100 hover:border-violet-200 hover:shadow-lg hover:-translate-y-0.5 transition-all bg-[#f8f9fc]">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-2xl mb-4 shadow-sm group-hover:shadow-md transition-shadow">
                  {f.icon}
                </div>
                <h3 className="font-bold text-slate-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gap Analyzer spotlight ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-10 sm:p-14 text-center">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-violet-600/20 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-sky-600/20 blur-3xl" />
            </div>
            <div className="relative z-10">
              <span className="inline-block bg-white/10 border border-white/20 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
                New Feature
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Know exactly what&apos;s missing
              </h2>
              <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
                The Gap Analyzer compares your resume to any job description and shows you — skill by skill —
                what you have, what you lack, and where to learn it.
              </p>
              <Link href="/gap-analysis" className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-50 px-8 py-4 rounded-2xl text-lg font-bold transition-colors">
                🔍 Try Gap Analyzer →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6 bg-white border-t border-slate-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Your next opportunity is waiting</h2>
          <p className="text-slate-500 text-lg mb-8">
            Build a professional, ATS-ready resume and close the skills gap — all in one place.
          </p>
          <Link href="/create" className="inline-block bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-10 py-4 rounded-2xl text-lg font-bold transition-all shadow-xl shadow-violet-200">
            Build My Resume — Free →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">R</div>
            <span className="font-semibold text-slate-700 text-sm">ResumeAI</span>
          </div>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} ResumeAI. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <Link href="/create" className="hover:text-slate-600 transition-colors">Builder</Link>
            <Link href="/gap-analysis" className="hover:text-slate-600 transition-colors">Gap Analyzer</Link>
          </div>
        </div>
      </footer>

    </main>
  );
}

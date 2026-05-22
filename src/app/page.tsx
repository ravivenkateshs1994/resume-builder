import Link from "next/link";

const features = [
  {
    icon: "🔍",
    title: "Gap Analyzer",
    desc: "Compare your resume to any job description and get a gap report with AI-curated learning resources for each missing skill.",
  },
  {
    icon: "🤖",

    title: "AI-Powered Writing",
    desc: "GPT-4o generates polished bullet points and professional summaries from your raw input.",
  },
  {
    icon: "📄",
    title: "Upload Existing Resume",
    desc: "Upload a PDF or DOCX and AI will parse and pre-fill all your information instantly.",
  },
  {
    icon: "🎯",
    title: "ATS Optimization",
    desc: "Paste a job description and get a tailored resume with keyword alignment and an ATS score.",
  },
  {
    icon: "🎨",
    title: "5 Professional Templates",
    desc: "Modern, Classic, Creative, Minimal, and Executive — all designed to impress.",
  },
  {
    icon: "📥",
    title: "PDF & DOCX Export",
    desc: "Download your finished resume in any format, ready to send to recruiters.",
  },
  {
    icon: "⚡",
    title: "Done in Minutes",
    desc: "Step-by-step guided form means no blank page anxiety — just fill and generate.",
  },
];

const steps = [
  { num: "1", label: "Fill in your info", desc: "Work history, education, skills" },
  { num: "2", label: "AI generates content", desc: "Bullets, summary, tailored to your role" },
  { num: "3", label: "Pick a template", desc: "5 professional designs to choose from" },
  { num: "4", label: "Download", desc: "PDF or DOCX, ready to submit" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Navbar */}
      <nav className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto app-panel rounded-b-2xl border-t-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📝</span>
          <span className="font-bold text-slate-900 text-lg tracking-tight">ResumeAI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/gap-analysis"
            className="text-sm text-slate-600 hover:text-slate-900 font-medium"
          >
            🔍 Gap Analyzer
          </Link>
          <Link
            href="/create"
            className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-teal-200"
          >
            Build My Resume
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center px-6 pt-20 pb-16">
        <div className="inline-block bg-white/80 border border-sky-100 text-sky-700 text-xs font-semibold px-3 py-1 rounded-full mb-6 shadow-sm">
          Smart Resume Studio
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 leading-tight">
          Build a Resume That
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-700 via-sky-600 to-cyan-500">
            Actually Gets Interviews
          </span>
        </h1>
        <p className="text-xl text-slate-600 mt-6 max-w-2xl mx-auto leading-relaxed">
          Fill out a guided form or upload your existing resume. AI writes the bullets,
          optimizes for ATS, and generates a professional summary — in any of 5 stunning templates.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          <Link
            href="/create"
            className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-colors shadow-xl shadow-teal-200"
          >
            Start from Scratch →
          </Link>
          <Link
            href="/create?upload=true"
            className="border-2 border-slate-200 bg-white/80 hover:border-slate-300 text-slate-700 px-8 py-4 rounded-2xl text-lg font-semibold transition-colors"
          >
            Upload Existing Resume
          </Link>
        </div>
        <p className="text-xs text-slate-500 mt-4">No account required · Free to use · Export anytime</p>
      </section>

      {/* How it works */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.num} className="text-center app-panel rounded-2xl py-5 px-3">
                <div className="w-12 h-12 bg-sky-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {s.num}
                </div>
                <h3 className="font-semibold text-slate-800">{s.label}</h3>
                <p className="text-sm text-slate-600 mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Everything You Need
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="app-panel rounded-2xl p-6 hover:-translate-y-0.5 transition-all"
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-slate-900 mb-1">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-teal-700 via-sky-700 to-cyan-600 py-16 px-6 text-center">
        <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">
          Ready to Land Your Next Role?
        </h2>
        <p className="text-cyan-50 mb-8 text-lg">
          Create a professional, ATS-optimized resume in under 10 minutes.
        </p>
        <Link
          href="/create"
          className="bg-white text-teal-700 hover:bg-cyan-50 px-8 py-4 rounded-2xl text-lg font-bold transition-colors inline-block"
        >
          Build My Resume — It&apos;s Free →
        </Link>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-slate-500">
        ResumeAI · Built with Next.js & GPT-4o
      </footer>
    </main>
  );
}

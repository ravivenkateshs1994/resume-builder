import type { Metadata } from "next";
import Link from "next/link";

const lastUpdated = "May 22, 2026";

type Section = {
  title: string;
  items: string[];
};

const sections: Section[] = [
  {
    title: "Information we collect",
    items: [
      "Information you enter into the app, including your name, contact details, work history, education, skills, job descriptions, and resume edits.",
      "Files you upload, such as PDF or DOCX resumes, along with the text extracted from those files for parsing and analysis.",
      "Basic device and usage data such as browser type, page views, and error logs that help keep the app stable.",
      "Data stored in your browser so your resume draft, template choices, and progress can persist between visits.",
    ],
  },
  {
    title: "How we use information",
    items: [
      "To build, edit, tailor, and export resumes and related documents.",
      "To parse uploaded resumes and run gap analysis against job descriptions you provide.",
      "To keep your draft and preferences available in your browser when you return.",
      "To improve reliability, fix bugs, and protect the app from abuse.",
    ],
  },
  {
    title: "How processing works",
    items: [
      "When you use AI-powered features, the relevant resume content, job description, or selected text is sent to server-side processing so the feature can respond.",
      "Uploaded PDF and DOCX files are processed to extract text and structure before the app generates results.",
      "The current version does not require an account, so the main persistent storage for your draft lives in your browser.",
    ],
  },
  {
    title: "Storage and retention",
    items: [
      "Resume data and settings are stored locally in your browser using persistent storage so you can resume where you left off.",
      "You can remove locally stored data by clearing site storage in your browser.",
      "We do not intentionally keep a separate user profile database in the current version of the app.",
    ],
  },
  {
    title: "Sharing and third parties",
    items: [
      "We do not sell your personal information.",
      "We may share content with service providers that help run the app, including AI and file-processing services, only as needed to provide the feature you requested.",
      "We may also disclose information if required by law or to protect the service and its users.",
    ],
  },
  {
    title: "Your choices and security",
    items: [
      "Do not upload information you are uncomfortable sharing.",
      "Review AI-generated output before sending it to employers or exporting it as a final resume.",
      "Clear your browser storage whenever you want to remove the locally saved draft.",
      "We use reasonable safeguards, but no online service can promise perfect security.",
    ],
  },
  {
    title: "Updates to this policy",
    items: [
      "We may update this policy as the app evolves.",
      "Continued use of the service after an update means you accept the revised policy.",
    ],
  },
];

export const metadata: Metadata = {
  title: "Privacy Policy | AI Resume Builder",
  description: "How AI Resume Builder collects, uses, stores, and shares information.",
};

function LegalSection({ title, items }: Section) {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-extrabold text-slate-900">{title}</h2>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f8f9fc] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-500 text-sm font-bold text-white">
              R
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">ResumeAI</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 sm:flex">
            <Link href="/" className="transition-colors hover:text-slate-900">
              Home
            </Link>
            <Link href="/create" className="transition-colors hover:text-slate-900">
              Builder
            </Link>
            <Link href="/gap-analysis" className="transition-colors hover:text-slate-900">
              Gap Analyzer
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 h-[560px] w-[560px] rounded-full bg-indigo-100/70 blur-3xl" />
          <div className="absolute top-16 right-0 h-[360px] w-[360px] rounded-full bg-sky-100/70 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl px-6 pb-14 pt-20 sm:pt-24">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm">
            Privacy Policy
          </span>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-6xl">
            How your resume data is handled
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-slate-500">
            This page explains what AI Resume Builder collects, how the app uses your resume content, and how your
            data is stored when you use the builder, upload a resume, or run gap analysis.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">No sign-in</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">The current version does not require an account to use the app.</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Browser storage</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Your draft and preferences are saved locally in your browser.</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">AI processing</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Resume text may be sent to server-side AI features when you ask for them.</p>
            </div>
          </div>
          <p className="mt-5 text-xs text-slate-400">Last updated {lastUpdated}</p>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-5xl gap-6">
          {sections.map((section) => (
            <LegalSection key={section.title} title={section.title} items={section.items} />
          ))}
          <div className="rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-xl shadow-slate-200 sm:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Plain-language summary</p>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-200">
              We use the information you enter to make the app work for you. If you want to remove locally saved data,
              clear your browser storage. If you are not comfortable with a particular upload or prompt, do not submit
              it.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} ResumeAI. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
            <Link href="/" className="transition-colors hover:text-slate-700">
              Home
            </Link>
            <Link href="/create" className="transition-colors hover:text-slate-700">
              Builder
            </Link>
            <Link href="/gap-analysis" className="transition-colors hover:text-slate-700">
              Gap Analyzer
            </Link>
            <Link href="/terms" className="transition-colors hover:text-slate-700">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

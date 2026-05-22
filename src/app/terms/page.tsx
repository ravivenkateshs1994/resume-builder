import type { Metadata } from "next";
import Link from "next/link";

const lastUpdated = "May 22, 2026";

type Section = {
  title: string;
  items: string[];
};

const sections: Section[] = [
  {
    title: "Acceptance of these terms",
    items: [
      "By visiting or using AI Resume Builder, you agree to these terms.",
      "If you do not agree, do not use the service.",
      "These terms apply to the current public version of the app and any related pages or tools we provide.",
    ],
  },
  {
    title: "What the service does",
    items: [
      "The service helps you create, edit, tailor, and export resumes and analyze gaps against job descriptions.",
      "It may also parse PDF or DOCX resumes and generate supporting content such as summaries, bullets, and skills.",
      "Features may change over time as the product evolves.",
    ],
  },
  {
    title: "Your content and responsibilities",
    items: [
      "You are responsible for the accuracy, legality, and appropriateness of any content you upload, paste, or generate.",
      "Do not submit content that violates another person's rights, includes confidential information you cannot share, or breaks any law.",
      "You should review every AI-generated suggestion before using it in an application or export.",
    ],
  },
  {
    title: "AI-generated output",
    items: [
      "The app uses AI and automated processing to draft content and analyze resumes.",
      "AI output may be incomplete, inaccurate, or not suited to your goals, so always verify it.",
      "We do not guarantee that AI-generated content will get you interviews, offers, or perfect ATS results.",
    ],
  },
  {
    title: "Intellectual property and licenses",
    items: [
      "You keep ownership of the resume content you create or upload.",
      "You grant us permission to process that content only to provide the service you requested.",
      "The app's design, code, branding, and templates remain our property or the property of their respective owners.",
    ],
  },
  {
    title: "Prohibited use",
    items: [
      "Do not abuse the service, try to break it, scrape it, or use it to distribute malware or harmful content.",
      "Do not use the service in a way that interferes with other users or with the app's normal operation.",
      "Do not misrepresent AI-generated material as verified facts without checking it first.",
    ],
  },
  {
    title: "Availability and changes",
    items: [
      "We may update, suspend, or discontinue features at any time.",
      "The service is provided on an \"as-is\" and \"as-available\" basis.",
      "We may revise these terms when the product changes, and continued use means you accept the revised terms.",
    ],
  },
  {
    title: "Disclaimer and liability",
    items: [
      "To the maximum extent allowed by law, we disclaim warranties about accuracy, fitness for a particular purpose, and uninterrupted operation.",
      "We are not liable for decisions you make based on generated content, including job applications or hiring outcomes.",
      "Use the service at your own discretion and keep your own backup copies of important content.",
    ],
  },
];

export const metadata: Metadata = {
  title: "Terms of Service | AI Resume Builder",
  description: "The terms that govern use of AI Resume Builder and its resume tools.",
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

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f8f9fc] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold text-white">
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
          <div className="absolute top-20 right-0 h-[360px] w-[360px] rounded-full bg-violet-100/70 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl px-6 pb-14 pt-20 sm:pt-24">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm">
            Terms of Service
          </span>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-6xl">
            The rules for using the app
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-slate-500">
            These terms explain what the service does, what you are responsible for, and the limits that apply when
            you use AI Resume Builder to create or analyze resumes.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Review your output</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">AI suggestions should always be checked before you submit them.</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Use responsibly</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Do not use the service to mislead employers or violate anyone&apos;s rights.</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Keep backups</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Save your own copy of anything important before you rely on it elsewhere.</p>
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
          <div className="rounded-3xl border border-slate-100 bg-slate-900 px-6 py-8 text-white shadow-xl shadow-slate-200 sm:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Short version</p>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-200">
              You can use the app to build and improve your resume, but you are responsible for checking the results,
              using the service lawfully, and making sure the content you submit is yours to share.
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
            <Link href="/privacy" className="transition-colors hover:text-slate-700">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

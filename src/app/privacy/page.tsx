import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const lastUpdated = "May 28, 2026";

type Section = {
  title: string;
  items: string[];
};

const sections: Section[] = [
  {
    title: "Information we collect",
    items: [
      "Information you provide when you create an account or sign in (for example, your email and profile metadata).",
      "Resume content and files you upload or save to your account (PDF, DOCX, and parsed resume data).",
      "Job descriptions, target role text, and any content you submit to the AI-powered tools for analysis or tailoring.",
      "Basic device, usage, and error data (browser type, page views, performance traces) to help maintain and improve the service.",
    ],
  },
  {
    title: "How we use information",
    items: [
      "To provide resume building, parsing, gap analysis, and export features you request.",
      "To persist your saved resumes and analyses when you opt to save them to your account.",
      "To run server-side AI processing and file extraction where required to produce results.",
      "To detect and prevent abuse, fix bugs, and improve the product experience.",
    ],
  },
  {
    title: "How processing works",
    items: [
      "When you use AI features, the relevant text is sent to the server and may be forwarded to third-party AI providers (configured by the operator) so the model can generate responses.",
      "Uploaded files are processed server-side to extract text and structure used by parsing and analysis routines.",
      "If you save data while signed in, that data is stored in our Supabase database and associated with your user account; if you use the app without signing in, drafts may be kept locally in your browser until you choose to save or upload them.",
    ],
  },
  {
    title: "Storage and retention",
    items: [
      "Saved resumes and analysis results for signed-in users are stored in our Supabase database and retained until you delete them or otherwise request removal.",
      "Local drafts stored in your browser persist until you clear site storage or they expire according to your browser settings.",
      "Authentication sessions are managed by Supabase; signing out will clear the client-side session for your browser.",
      "Backups, retention policies, and storage encryption are managed by our infrastructure providers (Supabase and cloud hosting).",
    ],
  },
  {
    title: "Sharing and third parties",
    items: [
      "We do not sell your personal information.",
      "We use third-party providers to host data and run AI models (for example Supabase for storage/auth and configured AI providers for model inference). These providers process data on our behalf and are subject to their own privacy and security practices.",
      "We may disclose information if required by law or to protect the service and its users.",
    ],
  },
  {
    title: "Your choices and security",
    items: [
      "You can delete saved resumes and analyses from your account via the dashboard; contact support if you need assistance removing data from our servers.",
      "To remove locally saved drafts, clear your browser site storage (localStorage / IndexedDB) for this site.",
      "Do not submit sensitive personal data (such as government ID numbers or health details) unless absolutely necessary — review AI output before sharing or exporting it.",
      "We use reasonable technical safeguards, but no system is perfect; if you discover a security issue, please report it to us.",
    ],
  },
  {
    title: "Updates to this policy",
    items: [
      "We may update this policy as the app evolves; the last updated date appears at the top of this page.",
      "If we make material changes, we will post the changes here and, where appropriate, notify signed-in users.",
    ],
  },
];

export const metadata: Metadata = {
  title: "Privacy Policy | Career Readiness",
  description: "How Career Readiness collects, uses, stores, and shares information.",
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
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 h-[560px] w-[560px] rounded-full bg-indigo-100/70 blur-3xl" />
          <div className="absolute top-16 right-0 h-[360px] w-[360px] rounded-full bg-sky-100/70 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl px-6 pb-14 pt-20 sm:pt-24">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm">
            Privacy Policy
          </span>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-6xl">
            How we handle your data
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-slate-500">
            This page explains what we collect, how we use it, and how it is stored when you use the app.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Sign in &amp; save</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Signing in lets you securely save resumes and analyses to your account (stored in Supabase). You can also
                use the app without signing in — drafts persist locally until you choose to save them.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Browser storage</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Your draft and preferences are saved locally in your browser.</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">AI processing</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Resume text may be processed by server-side AI features when requested.</p>
            </div>
          </div>
          <p className="mt-5 text-xs text-slate-600">Last updated {lastUpdated}</p>
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

      <SiteFooter />
    </main>
  );
}

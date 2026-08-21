import Link from "next/link";

type WireframeBlock = {
  title: string;
  notes: string;
};

const marketingFlow: WireframeBlock[] = [
  {
    title: "Hero + Product Proof",
    notes:
      "Two-column hero: value proposition on left, live product preview on right. Include social proof strip directly under CTAs.",
  },
  {
    title: "How It Works (3 Steps)",
    notes:
      "Simple horizontal sequence: Upload Resume, Match with Job, Get Improvement Plan.",
  },
  {
    title: "Core Tool Grid",
    notes:
      "Six feature cards grouped by outcomes: Build, Analyze, Improve, Practice.",
  },
  {
    title: "Persona Split",
    notes:
      "Two panels for Fresher and Experienced users with targeted benefits and CTA.",
  },
  {
    title: "Trust + Testimonials + CTA",
    notes:
      "Metrics row, user testimonials, then one primary conversion banner.",
  },
];

const dashboardFlow: WireframeBlock[] = [
  {
    title: "Top Utility Bar",
    notes:
      "Search, notifications, profile actions, and quick-create button.",
  },
  {
    title: "Career Score Panel",
    notes:
      "Overall score ring, four sub-scores, trend badge, and one recommended next action.",
  },
  {
    title: "Action Queue",
    notes:
      "Prioritized tasks: Missing keywords, weak sections, interview prep tasks.",
  },
  {
    title: "Resumes + Analyses Workspace",
    notes:
      "Tabs with resume list, analysis history, and side preview panel.",
  },
  {
    title: "Progress Timeline",
    notes:
      "Recent actions and wins to reinforce progress over time.",
  },
];

const createFlow: WireframeBlock[] = [
  {
    title: "Step Wizard Header",
    notes:
      "Persistent progress bar with clear step names and autosave state.",
  },
  {
    title: "Left Context, Right Editor",
    notes:
      "Left: JD and AI suggestions. Right: editable resume content.",
  },
  {
    title: "Inline Quality Signals",
    notes:
      "Each section gets an ATS/readability badge and quick-fix actions.",
  },
  {
    title: "Review & Export",
    notes:
      "Final screen with score summary, checklist, and export options.",
  },
];

function DesktopWireframe({
  title,
  subtitle,
  blocks,
  accent,
}: {
  title: string;
  subtitle: string;
  blocks: WireframeBlock[];
  accent: string;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.9)]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm text-slate-300">{subtitle}</p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{ backgroundColor: accent, color: "#0f172a" }}
        >
          Desktop
        </span>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-950/80 p-4">
        <div className="mb-3 h-10 rounded-md border border-white/10 bg-slate-900" />
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-8 space-y-3">
            {blocks.slice(0, 3).map((b) => (
              <div key={b.title} className="rounded-md border border-white/10 bg-slate-900 p-3">
                <p className="text-sm font-semibold text-white">{b.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">{b.notes}</p>
              </div>
            ))}
          </div>
          <div className="col-span-4 space-y-3">
            {blocks.slice(3).map((b) => (
              <div key={b.title} className="rounded-md border border-white/10 bg-slate-900 p-3">
                <p className="text-sm font-semibold text-white">{b.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">{b.notes}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MobileWireframe({
  title,
  blocks,
  accent,
}: {
  title: string;
  blocks: WireframeBlock[];
  accent: string;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.9)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{ backgroundColor: accent, color: "#0f172a" }}
        >
          Mobile
        </span>
      </div>

      <div className="mx-auto w-full max-w-[390px] rounded-[24px] border-2 border-white/10 bg-slate-950 p-3">
        <div className="mb-2 h-6 rounded bg-slate-900" />
        <div className="space-y-2">
          {blocks.map((b) => (
            <div key={b.title} className="rounded-md border border-white/10 bg-slate-900 p-2.5">
              <p className="text-xs font-semibold text-white">{b.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{b.notes}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 h-7 rounded bg-slate-900" />
      </div>
    </section>
  );
}

export default function WireframesPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-7xl px-5 py-10 md:px-8">
        <div className="mb-8 rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.9)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
            Design directions
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            Wireframe system for Career Readiness
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
            A conversion-first pattern library: product-led hero, immediate proof, progressive onboarding, and task-driven dashboards.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <span className="rounded-full border border-white/10 bg-slate-950/80 px-3 py-1">Hero with product preview</span>
            <span className="rounded-full border border-white/10 bg-slate-950/80 px-3 py-1">Trust metrics above fold</span>
            <span className="rounded-full border border-white/10 bg-slate-950/80 px-3 py-1">Outcome-focused dashboard</span>
            <span className="rounded-full border border-white/10 bg-slate-950/80 px-3 py-1">Guided multi-step workflow</span>
          </div>
        </div>

        <div className="space-y-6">
          <DesktopWireframe
            title="Wireframe A: Marketing Homepage"
            subtitle="Conversion-first SaaS landing flow"
            blocks={marketingFlow}
            accent="#dbeafe"
          />

          <DesktopWireframe
            title="Wireframe B: Logged-in Dashboard"
            subtitle="Action-oriented user workspace"
            blocks={dashboardFlow}
            accent="#dcfce7"
          />

          <DesktopWireframe
            title="Wireframe C: Create / Tailor Flow"
            subtitle="Builder experience with AI assist"
            blocks={createFlow}
            accent="#fef3c7"
          />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <MobileWireframe title="Homepage Mobile Flow" blocks={marketingFlow.slice(0, 4)} accent="#dbeafe" />
          <MobileWireframe title="Dashboard Mobile Flow" blocks={dashboardFlow.slice(0, 4)} accent="#dcfce7" />
          <MobileWireframe title="Create Flow Mobile" blocks={createFlow} accent="#fef3c7" />
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.9)]">
          <h2 className="text-lg font-semibold text-white">What we should build next</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-300">
            <li>Implement Wireframe A sections and spacing hierarchy in the homepage.</li>
            <li>Refactor header and footer to follow SaaS nav standards.</li>
            <li>Apply Wireframe B layout to dashboard cards and action queue.</li>
            <li>Apply Wireframe C structure to create/tailor workflow.</li>
          </ol>
          <div className="mt-5">
            <Link
              href="/"
              className="inline-flex items-center rounded-lg border border-white/10 bg-slate-950/80 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

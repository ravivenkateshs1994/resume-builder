import type { ResumeData } from "@/types/resume";
import { createTemplateTheme, getDefaultTemplateAccent } from "@/lib/templateTheme";
import HeadshotAvatar from "@/components/HeadshotAvatar";

interface Props {
  data: ResumeData;
  accentColor?: string;
}

// ─── Section heading ──────────────────────────────────────────────────────────
function Section({
  title,
  children,
  theme,
}: {
  title: string;
  children: React.ReactNode;
  theme: ReturnType<typeof createTemplateTheme>;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: theme.accent }}>
          {title}
        </h2>
        <div className="flex-1 h-px" style={{ backgroundColor: theme.accentBorder }} />
      </div>
      {children}
    </div>
  );
}

// ─── Nova Template — avatar-header with full-width accent banner ───────────────
export default function NovaTemplate({ data, accentColor }: Props) {
  const { personalInfo, summary, workExperience, education, skills, certifications } = data;
  const theme = createTemplateTheme(accentColor ?? getDefaultTemplateAccent("nova"));

  // Derive initials from full name
  const initials = personalInfo.fullName
    ? personalInfo.fullName
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("")
    : "?";

  return (
    <div className="font-sans text-gray-800 text-[13px] leading-relaxed max-w-[780px] mx-auto bg-white">
      {/* ── Header banner ─────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-6 px-8 py-7"
        style={{ backgroundColor: theme.accent, color: theme.contrast }}
      >
        {/* Avatar circle */}
        <HeadshotAvatar
          headshotUrl={personalInfo.headshotUrl}
          initials={initials}
          alt={`${personalInfo.fullName || "Candidate"} headshot`}
          className="w-32 h-32 rounded-3xl overflow-hidden flex-shrink-0 ring-2 ring-white/20"
          fallbackClassName="h-full w-full flex items-center justify-center text-3xl font-bold select-none"
          style={{ backgroundColor: theme.accentDeep, color: theme.contrastDeep }}
        />

        {/* Name + title + contacts */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight leading-tight">
            {personalInfo.fullName || "Your Name"}
          </h1>
          {personalInfo.jobTitle && (
            <p className="text-sm mt-0.5 font-medium" style={{ color: theme.accentSofter }}>
              {personalInfo.jobTitle}
            </p>
          )}
          <div
            className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2.5 text-[11px]"
            style={{ color: theme.accentSofter }}
          >
            {personalInfo.email && <span>✉ {personalInfo.email}</span>}
            {personalInfo.phone && <span>✆ {personalInfo.phone}</span>}
            {personalInfo.location && <span>⊙ {personalInfo.location}</span>}
            {personalInfo.linkedin && <span>🔗 {personalInfo.linkedin}</span>}
            {personalInfo.website && <span>🌐 {personalInfo.website}</span>}
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────────── */}
      <div className="px-8 py-6">
        {/* Summary */}
        {summary && (
          <Section title="Professional Summary" theme={theme}>
            <p className="text-gray-700 leading-relaxed">{summary}</p>
          </Section>
        )}

        {/* Experience */}
        {workExperience.length > 0 && (
          <Section title="Work Experience" theme={theme}>
            {workExperience.map((w) => (
              <div key={w.id} className="mb-5">
                <div className="flex justify-between items-baseline gap-4 flex-wrap">
                  <div>
                    <span className="font-semibold text-gray-900">{w.title}</span>
                    {w.company && (
                      <span className="ml-2 font-medium" style={{ color: theme.accent }}>
                        @ {w.company}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400 text-xs whitespace-nowrap">
                    {w.startDate} – {w.endDate}
                  </span>
                </div>
                {w.location && <p className="text-gray-400 text-xs">{w.location}</p>}
                {w.description && (
                  <div
                    className="resume-desc text-gray-700 mt-1"
                    dangerouslySetInnerHTML={{ __html: w.description }}
                  />
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <Section title="Education" theme={theme}>
            {education.map((e) => (
              <div key={e.id} className="mb-3 flex justify-between items-baseline gap-4 flex-wrap">
                <div>
                  <span className="font-semibold text-gray-900">
                    {e.degree} {e.field && `in ${e.field}`}
                  </span>
                  {e.institution && (
                    <span className="ml-2" style={{ color: theme.accent }}>
                      — {e.institution}
                    </span>
                  )}
                  {(e.gpa || e.honors) && (
                    <p className="text-gray-500 text-xs mt-0.5">
                      {[e.gpa && `GPA: ${e.gpa}`, e.honors].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <span className="text-gray-400 text-xs whitespace-nowrap">
                  {e.startDate} – {e.endDate}
                </span>
              </div>
            ))}
          </Section>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <Section title="Skills" theme={theme}>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span
                  key={s}
                  className="rounded-full px-3 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: theme.accent,
                    color: theme.contrast,
                    border: `1px solid ${theme.accentDeep}`,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <Section title="Certifications" theme={theme}>
            <div className="grid gap-3 sm:grid-cols-2">
              {certifications.map((c) => (
                <div key={c.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm">
                  <div className="text-sm font-semibold leading-tight text-gray-800">{c.name}</div>
                  <div className="mt-1 text-xs text-gray-500">{c.issuer}</div>
                  {!c.neverExpires && c.validTo && (
                    <div className="mt-2 text-[11px] font-medium text-gray-500">{c.validTo}</div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

import type { ResumeData } from "@/types/resume";
import { createTemplateTheme, getDefaultTemplateAccent } from "@/lib/templateTheme";

interface Props {
  data: ResumeData;
  accentColor?: string;
}

// ─── Shared section heading ───────────────────────────────────────────────────
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
    <div className="mb-5">
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.accent }}>
          {title}
        </h2>
        <div className="flex-1 h-px" style={{ backgroundColor: theme.accentSoft }} />
      </div>
      {children}
    </div>
  );
}

// ─── Modern Template ──────────────────────────────────────────────────────────
export default function ModernTemplate({ data, accentColor }: Props) {
  const { personalInfo, summary, workExperience, education, skills, certifications } = data;
  const theme = createTemplateTheme(accentColor ?? getDefaultTemplateAccent("modern"));

  return (
    <div className="font-sans text-gray-800 text-[13px] leading-relaxed max-w-[780px] mx-auto bg-white">
      {/* Header */}
      <div className="px-8 py-6 rounded-t-sm" style={{ backgroundColor: theme.accent, color: theme.contrast }}>
        <h1 className="text-2xl font-bold tracking-tight">{personalInfo.fullName || "Your Name"}</h1>
        {personalInfo.jobTitle && (
          <p className="text-sm mt-0.5" style={{ color: theme.accentSofter }}>
            {personalInfo.jobTitle}
          </p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs" style={{ color: theme.accentSofter }}>
          {personalInfo.email && <span>✉ {personalInfo.email}</span>}
          {personalInfo.phone && <span>✆ {personalInfo.phone}</span>}
          {personalInfo.location && <span>⊙ {personalInfo.location}</span>}
          {personalInfo.linkedin && <span>🔗 {personalInfo.linkedin}</span>}
          {personalInfo.website && <span>🌐 {personalInfo.website}</span>}
        </div>
      </div>

      {/* Body */}
      <div className="px-8 py-6">
        {/* Summary */}
        {summary && (
          <Section title="Professional Summary" theme={theme}>
            <p className="text-gray-700">{summary}</p>
          </Section>
        )}

        {/* Experience */}
        {workExperience.length > 0 && (
          <Section title="Work Experience" theme={theme}>
            {workExperience.map((w) => (
              <div key={w.id} className="mb-4">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-semibold text-gray-900">{w.title}</span>
                    {w.company && (
                      <span className="ml-2" style={{ color: theme.accent }}>
                        @ {w.company}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400 text-xs whitespace-nowrap">
                    {w.startDate} – {w.endDate}
                  </span>
                </div>
                {w.location && (
                  <p className="text-gray-400 text-xs">{w.location}</p>
                )}
{w.description && (
                  <div className="resume-desc text-gray-700" dangerouslySetInnerHTML={{ __html: w.description }} />
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <Section title="Education" theme={theme}>
            {education.map((e) => (
              <div key={e.id} className="mb-3">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-semibold">
                      {e.degree} {e.field && `in ${e.field}`}
                    </span>
                    {e.institution && (
                      <span className="ml-2" style={{ color: theme.accent }}>
                        — {e.institution}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400 text-xs">
                    {e.startDate} – {e.endDate}
                  </span>
                </div>
                {(e.gpa || e.honors) && (
                  <p className="text-gray-500 text-xs mt-0.5">
                    {[e.gpa && `GPA: ${e.gpa}`, e.honors].filter(Boolean).join(" · ")}
                  </p>
                )}
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
                  style={{ backgroundColor: theme.accent, color: theme.contrast, border: `1px solid ${theme.accentDeep}` }}
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
            {certifications.map((c) => (
              <div key={c.id} className="flex justify-between text-sm">
                <span className="font-medium">{c.name}</span>
                <span className="text-gray-500">
                  {c.issuer} · {c.date}
                </span>
              </div>
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}

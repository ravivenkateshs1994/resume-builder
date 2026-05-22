import type { ResumeData } from "@/types/resume";
import { createTemplateTheme, getDefaultTemplateAccent } from "@/lib/templateTheme";

interface Props { data: ResumeData; accentColor?: string }

// ─── Tech Template — dark header, monospace hints, skill chips, code-vibe ─────
export default function TechTemplate({ data, accentColor }: Props) {
  const { personalInfo, summary, workExperience, education, skills, certifications } = data;
  const theme = createTemplateTheme(accentColor ?? getDefaultTemplateAccent("tech"));

  return (
    <div className="font-sans text-gray-800 text-[12.5px] leading-relaxed max-w-[780px] mx-auto bg-white">
      {/* ── Header — dark + cyan accent ── */}
      <div className="bg-gray-950 text-white px-10 py-7">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-mono text-white">
              {personalInfo.fullName || "Your Name"}
            </h1>
            {personalInfo.jobTitle && (
              <p className="text-sm font-mono mt-1" style={{ color: theme.accentSofter }}>
                {personalInfo.jobTitle}
              </p>
            )}
          </div>
          <div className="text-right text-xs text-gray-400 space-y-0.5 flex-shrink-0 font-mono">
            {personalInfo.email && (
              <div><span style={{ color: theme.accent }}>@</span> {personalInfo.email}</div>
            )}
            {personalInfo.phone && (
              <div><span style={{ color: theme.accent }}>#</span> {personalInfo.phone}</div>
            )}
            {personalInfo.location && (
              <div><span style={{ color: theme.accent }}>⊙</span> {personalInfo.location}</div>
            )}
            {personalInfo.linkedin && (
              <div style={{ color: theme.accentSofter }}>{personalInfo.linkedin}</div>
            )}
            {personalInfo.website && (
              <div style={{ color: theme.accentSofter }}>{personalInfo.website}</div>
            )}
          </div>
        </div>

        {/* Skills bar — shown in header for tech impact */}
        {skills.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {skills.map((s, i) => (
              <span
                key={i}
                className="rounded px-2 py-0.5 text-[10.5px] font-mono"
                style={{ backgroundColor: theme.accent, color: theme.contrast, border: `1px solid ${theme.accentDeep}` }}
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Cyan stripe */}
      <div className="h-1" style={{ backgroundColor: theme.accent }} />

      {/* ── Body ── */}
      <div className="px-10 py-6">
        {/* Summary */}
        {summary && (
          <div className="mb-6">
            <TechSection title="// about" theme={theme} />
            <p className="text-gray-700 leading-relaxed">{summary}</p>
          </div>
        )}

        {/* Experience */}
        {workExperience.length > 0 && (
          <div className="mb-6">
            <TechSection title="// experience" theme={theme} />
            <div className="space-y-5">
              {workExperience.map((w) => (
                <div key={w.id} className="pl-4" style={{ borderLeft: `2px solid ${theme.accent}` }}>
                  <div className="flex justify-between items-baseline gap-2">
                    <div>
                      <span className="font-bold text-gray-900">{w.title}</span>
                      {w.company && (
                        <span className="font-semibold text-xs ml-2" style={{ color: theme.accent }}>@ {w.company}</span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 font-mono flex-shrink-0">
                      {[w.startDate, w.endDate].filter(Boolean).join(" → ")}
                    </span>
                  </div>
                  {w.location && (
                    <div className="text-xs text-gray-400 mt-0.5">{w.location}</div>
                  )}
                  {w.description && (
                    <div
                      className="mt-1.5 text-gray-600 resume-desc"
                      dangerouslySetInnerHTML={{ __html: w.description }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Two columns — education & certs */}
        <div className="grid grid-cols-2 gap-8">
          {education.length > 0 && (
            <div>
              <TechSection title="// education" theme={theme} />
              <div className="space-y-3">
                {education.map((e) => (
                  <div key={e.id}>
                    <div className="font-bold text-gray-900">
                      {e.degree}{e.field ? ` in ${e.field}` : ""}
                    </div>
                    <div className="text-xs font-medium" style={{ color: theme.accent }}>{e.institution}</div>
                    <div className="text-gray-400 text-[11px] font-mono">
                      {[e.startDate, e.endDate].filter(Boolean).join(" – ")}
                      {e.gpa ? ` · GPA ${e.gpa}` : ""}
                    </div>
                    {e.honors && (
                      <div className="text-gray-500 text-[11px]">{e.honors}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {certifications.length > 0 && (
            <div>
              <TechSection title="// certifications" theme={theme} />
              <div className="space-y-2">
                {certifications.map((c) => (
                  <div key={c.id}>
                    <div className="font-bold text-gray-900 text-xs leading-snug">{c.name}</div>
                    <div className="text-gray-400 text-[11px]">
                      {c.issuer}
                      {c.date ? ` · ${c.date}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TechSection({ title, theme }: { title: string; theme: ReturnType<typeof createTemplateTheme> }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <h2 className="text-[11px] font-bold font-mono whitespace-nowrap" style={{ color: theme.accent }}>
        {title}
      </h2>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

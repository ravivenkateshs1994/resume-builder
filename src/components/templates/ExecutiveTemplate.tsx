import type { ResumeData } from "@/types/resume";
import { createTemplateTheme, getDefaultTemplateAccent } from "@/lib/templateTheme";

interface Props { data: ResumeData; accentColor?: string }

// ─── Executive Template — dark header band, conservative corporate ────────────
export default function ExecutiveTemplate({ data, accentColor }: Props) {
  const { personalInfo, summary, workExperience, education, skills, certifications } = data;
  const theme = createTemplateTheme(accentColor ?? getDefaultTemplateAccent("executive"));

  return (
    <div className="font-sans text-[12.5px] leading-relaxed max-w-[780px] mx-auto bg-white">
      {/* Dark header band */}
      <div className="px-10 py-7" style={{ backgroundColor: theme.accentDeep, color: theme.contrastDeep }}>
        <h1 className="text-2xl font-bold tracking-widest uppercase">
          {personalInfo.fullName || "Your Name"}
        </h1>
        {personalInfo.jobTitle && (
          <p className="text-sm mt-1 font-medium uppercase tracking-wider" style={{ color: theme.accentSofter }}>
            {personalInfo.jobTitle}
          </p>
        )}
        <div className="flex flex-wrap gap-x-6 mt-3 text-xs" style={{ color: theme.accentSofter }}>
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
          {personalInfo.website && <span>{personalInfo.website}</span>}
        </div>
      </div>

      {/* Gold accent bar */}
      <div className="h-1" style={{ backgroundColor: theme.accent }} />

      <div className="px-10 py-7">
        {/* Summary */}
        {summary && (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] border-b pb-1 mb-2" style={{ color: theme.accentDeep, borderColor: theme.accentBorder }}>
              Executive Summary
            </h2>
            <p className="text-gray-700">{summary}</p>
          </div>
        )}

        {/* Experience */}
        {workExperience.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] border-b pb-1 mb-3" style={{ color: theme.accentDeep, borderColor: theme.accentBorder }}>
              Professional Experience
            </h2>
            {workExperience.map((w) => (
              <div key={w.id} className="mb-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{w.title}</p>
                    <p className="font-medium text-xs" style={{ color: theme.accent }}>
                      {[w.company, w.location].filter(Boolean).join("  ·  ")}
                    </p>
                  </div>
                  <span className="text-gray-500 text-xs whitespace-nowrap bg-gray-100 px-2 py-0.5 rounded">
                    {w.startDate} – {w.endDate}
                  </span>
                </div>
{w.description && (
                  <div className="resume-desc text-gray-700" dangerouslySetInnerHTML={{ __html: w.description }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Two-column bottom section */}
        <div className="grid grid-cols-2 gap-8">
          {/* Education */}
          {education.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] border-b pb-1 mb-3" style={{ color: theme.accentDeep, borderColor: theme.accentBorder }}>
                Education
              </h2>
              {education.map((e) => (
                <div key={e.id} className="mb-3">
                  <p className="font-semibold text-gray-900 text-xs">
                    {e.degree} {e.field && `in ${e.field}`}
                  </p>
                  <p className="text-gray-600 text-xs">{e.institution}</p>
                  <p className="text-gray-400 text-xs">
                    {e.startDate} – {e.endDate}
                    {e.gpa && ` · GPA ${e.gpa}`}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Skills + Certs */}
          <div>
            {skills.length > 0 && (
              <div className="mb-4">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] border-b pb-1 mb-2" style={{ color: theme.accentDeep, borderColor: theme.accentBorder }}>
                  Core Competencies
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <span key={s} className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: theme.accent, color: theme.contrast, border: `1px solid ${theme.accentDeep}` }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {certifications.length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] border-b pb-1 mb-2" style={{ color: theme.accentDeep, borderColor: theme.accentBorder }}>
                  Certifications
                </h2>
                {certifications.map((c) => (
                  <div key={c.id} className="mb-1.5">
                    <p className="font-medium text-xs">{c.name}</p>
                    <p className="text-gray-500 text-xs">
                      {c.issuer} · {c.date}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

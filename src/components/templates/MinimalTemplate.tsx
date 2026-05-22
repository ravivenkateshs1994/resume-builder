import type { ResumeData } from "@/types/resume";
import { createTemplateTheme, getDefaultTemplateAccent } from "@/lib/templateTheme";

interface Props { data: ResumeData; accentColor?: string }

// ─── Minimal Template — ultra-clean, lots of whitespace ───────────────────────
export default function MinimalTemplate({ data, accentColor }: Props) {
  const { personalInfo, summary, workExperience, education, skills, certifications } = data;
  const theme = createTemplateTheme(accentColor ?? getDefaultTemplateAccent("minimal"));

  return (
    <div className="font-sans text-gray-700 text-[13px] leading-relaxed max-w-[760px] mx-auto bg-white px-12 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-light text-gray-900 tracking-tight">
          {personalInfo.fullName || "Your Name"}
        </h1>
        {personalInfo.jobTitle && (
          <p className="text-gray-500 mt-1 text-sm">{personalInfo.jobTitle}</p>
        )}
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-400">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
          {personalInfo.website && <span>{personalInfo.website}</span>}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="mb-8">
          <p className="text-gray-600 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Experience */}
      {workExperience.length > 0 && (
        <div className="mb-8">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: theme.accent }}>
            Experience
          </h2>
          {workExperience.map((w) => (
            <div key={w.id} className="mb-6 grid grid-cols-[1fr_auto] gap-4">
              <div>
                <p className="font-semibold text-gray-900">{w.title}</p>
                <p className="text-xs mt-0.5" style={{ color: theme.accent }}>
                  {[w.company, w.location].filter(Boolean).join(" · ")}
                </p>
                {w.description && (
                  <div className="resume-desc-minimal" dangerouslySetInnerHTML={{ __html: w.description }} />
                )}
              </div>
              <p className="text-xs text-gray-400 whitespace-nowrap text-right">
                {w.startDate}
                <br />
                {w.endDate}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-8">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: theme.accent }}>
            Education
          </h2>
          {education.map((e) => (
            <div key={e.id} className="flex justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-900">
                  {e.degree} {e.field && `in ${e.field}`}
                </p>
                <p className="text-gray-500 text-xs">{e.institution}</p>
              </div>
              <p className="text-xs text-gray-400 text-right whitespace-nowrap">
                {e.startDate} – {e.endDate}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mb-8">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: theme.accent }}>
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span
                key={s}
                className="text-xs rounded px-2 py-0.5"
                style={{ color: theme.accentDeep, border: `1px solid ${theme.accentBorder}` }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: theme.accent }}>
            Certifications
          </h2>
          {certifications.map((c) => (
            <div key={c.id} className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-700">{c.name}</span>
              <span className="text-gray-400 text-xs">
                {c.issuer} · {c.date}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

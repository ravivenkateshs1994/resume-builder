import type { ResumeData } from "@/types/resume";
import { createTemplateTheme, getDefaultTemplateAccent } from "@/lib/templateTheme";

interface Props { data: ResumeData; accentColor?: string }

function HR({ color }: { color: string }) {
  return <hr className="my-3" style={{ borderColor: color }} />;
}

// ─── Classic Template — traditional single-column ─────────────────────────────
export default function ClassicTemplate({ data, accentColor }: Props) {
  const { personalInfo, summary, workExperience, education, skills, certifications } = data;
  const theme = createTemplateTheme(accentColor ?? getDefaultTemplateAccent("classic"));

  return (
    <div className="font-serif text-gray-900 text-[13px] leading-relaxed max-w-[780px] mx-auto bg-white px-10 py-8">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold tracking-tight uppercase">
          {personalInfo.fullName || "Your Name"}
        </h1>
        {personalInfo.jobTitle && (
          <p className="text-gray-600 mt-1 italic">{personalInfo.jobTitle}</p>
        )}
        <p className="text-sm text-gray-600 mt-2">
          {[personalInfo.email, personalInfo.phone, personalInfo.location]
            .filter(Boolean)
            .join("  |  ")}
        </p>
        {(personalInfo.linkedin || personalInfo.website) && (
          <p className="text-sm text-gray-500">
            {[personalInfo.linkedin, personalInfo.website].filter(Boolean).join("  |  ")}
          </p>
        )}
      </div>

      <HR color={theme.accent} />

      {/* Summary */}
      {summary && (
        <>
          <h2 className="text-sm font-bold uppercase tracking-widest mb-1" style={{ color: theme.accent }}>
            Professional Summary
          </h2>
          <p className="text-gray-700 mb-3">{summary}</p>
          <HR color={theme.accent} />
        </>
      )}

      {/* Experience */}
      {workExperience.length > 0 && (
        <>
          <h2 className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: theme.accent }}>
            Professional Experience
          </h2>
          {workExperience.map((w) => (
            <div key={w.id} className="mb-4">
              <div className="flex justify-between">
                <span className="font-bold">{w.title}</span>
                      <span className="text-xs" style={{ color: theme.accent }}>
                  {w.startDate} – {w.endDate}
                </span>
              </div>
              <p className="text-xs italic" style={{ color: theme.accent }}>
                {[w.company, w.location].filter(Boolean).join(", ")}
              </p>
              {w.description && (
                <div className="resume-desc text-gray-800" dangerouslySetInnerHTML={{ __html: w.description }} />
              )}
            </div>
          ))}
          <HR color={theme.accent} />
        </>
      )}

      {/* Education */}
      {education.length > 0 && (
        <>
          <h2 className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: theme.accent }}>
            Education
          </h2>
          {education.map((e) => (
            <div key={e.id} className="flex justify-between mb-2">
              <div>
                <p className="font-bold">
                  {e.degree} {e.field && `in ${e.field}`}
                </p>
                <p className="text-gray-600 italic text-xs">{e.institution}</p>
                {(e.gpa || e.honors) && (
                  <p className="text-gray-500 text-xs">
                    {[e.gpa && `GPA: ${e.gpa}`, e.honors].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              <span className="text-xs whitespace-nowrap" style={{ color: theme.accent }}>
                {e.startDate} – {e.endDate}
              </span>
            </div>
          ))}
          <HR color={theme.accent} />
        </>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <>
          <h2 className="text-sm font-bold uppercase tracking-widest mb-1" style={{ color: theme.accent }}>
            Skills
          </h2>
          <p className="text-gray-800">{skills.join("  •  ")}</p>
          {certifications.length > 0 && <HR color={theme.accent} />}
        </>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <>
          <h2 className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: theme.accent }}>
            Certifications
          </h2>
          {certifications.map((c) => (
            <div key={c.id} className="flex justify-between text-sm">
              <span className="font-medium">{c.name}</span>
              <span className="text-gray-500">
                {c.issuer} · {c.date}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

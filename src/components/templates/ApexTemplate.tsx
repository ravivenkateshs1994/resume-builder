import type { ResumeData } from "@/types/resume";
import { createTemplateTheme, getDefaultTemplateAccent } from "@/lib/templateTheme";

interface Props {
  data: ResumeData;
  accentColor?: string;
}

// ─── Apex Template — ATS-clean single column, bold section rules ──────────────
export default function ApexTemplate({ data, accentColor }: Props) {
  const { personalInfo, summary, workExperience, education, skills, certifications } = data;
  const theme = createTemplateTheme(accentColor ?? getDefaultTemplateAccent("apex"));

  return (
    <div className="font-sans text-gray-800 text-[13px] leading-relaxed max-w-[760px] mx-auto bg-white px-10 py-9">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
          {personalInfo.fullName || "Your Name"}
        </h1>
        {personalInfo.jobTitle && (
          <p className="text-sm font-semibold mt-0.5" style={{ color: theme.accent }}>
            {personalInfo.jobTitle}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-2 text-xs text-gray-500">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && (
            <>
              <span className="text-gray-300">|</span>
              <span>{personalInfo.phone}</span>
            </>
          )}
          {personalInfo.location && (
            <>
              <span className="text-gray-300">|</span>
              <span>{personalInfo.location}</span>
            </>
          )}
          {personalInfo.linkedin && (
            <>
              <span className="text-gray-300">|</span>
              <span>{personalInfo.linkedin}</span>
            </>
          )}
          {personalInfo.website && (
            <>
              <span className="text-gray-300">|</span>
              <span>{personalInfo.website}</span>
            </>
          )}
        </div>
      </div>

      {/* ── Summary ───────────────────────────────────────────────────────────── */}
      {summary && (
        <div className="mb-5">
          <SectionRule title="Professional Summary" theme={theme} />
          <p className="text-gray-700 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* ── Experience ────────────────────────────────────────────────────────── */}
      {workExperience.length > 0 && (
        <div className="mb-5">
          <SectionRule title="Work Experience" theme={theme} />
          {workExperience.map((w) => (
            <div key={w.id} className="mb-4">
              <div className="flex justify-between items-baseline gap-4 flex-wrap">
                <div>
                  <span className="font-bold text-gray-900">{w.title}</span>
                  {w.company && (
                    <span className="ml-1.5 font-semibold" style={{ color: theme.accent }}>
                      · {w.company}
                    </span>
                  )}
                </div>
                <span className="text-gray-400 text-xs whitespace-nowrap font-medium">
                  {w.startDate} – {w.endDate}
                </span>
              </div>
              {w.location && (
                <p className="text-gray-400 text-xs mb-0.5">{w.location}</p>
              )}
              {w.description && (
                <div
                  className="resume-desc text-gray-700"
                  dangerouslySetInnerHTML={{ __html: w.description }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Education ─────────────────────────────────────────────────────────── */}
      {education.length > 0 && (
        <div className="mb-5">
          <SectionRule title="Education" theme={theme} />
          {education.map((e) => (
            <div key={e.id} className="mb-2.5 flex justify-between items-baseline gap-4 flex-wrap">
              <div>
                <span className="font-bold text-gray-900">
                  {e.degree} {e.field && `in ${e.field}`}
                </span>
                {e.institution && (
                  <span className="ml-1.5 text-gray-600">· {e.institution}</span>
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
        </div>
      )}

      {/* ── Skills ────────────────────────────────────────────────────────────── */}
      {skills.length > 0 && (
        <div className="mb-5">
          <SectionRule title="Skills" theme={theme} />
          <div className="grid grid-cols-4 gap-x-3 gap-y-1.5">
            {skills.map((s) => (
              <span
                key={s}
                className="text-xs px-2 py-0.5 rounded text-center"
                style={{
                  color: theme.accentDeep,
                  border: `1px solid ${theme.accentBorder}`,
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Certifications ────────────────────────────────────────────────────── */}
      {certifications.length > 0 && (
        <div>
          <SectionRule title="Certifications" theme={theme} />
          {certifications.map((c) => (
            <div key={c.id} className="mb-2 space-y-0.5">
              <div className="font-semibold text-gray-800">{c.name}</div>
              <div className="text-gray-400 text-xs">{c.issuer}</div>
              {!c.neverExpires && c.validTo && (
                <div className="text-gray-400 text-xs">{c.validTo}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Bold underline rule section heading ──────────────────────────────────────
function SectionRule({
  title,
  theme,
}: {
  title: string;
  theme: ReturnType<typeof createTemplateTheme>;
}) {
  return (
    <div className="mb-2.5">
      <h2 className="text-sm font-black uppercase tracking-wide text-gray-900">{title}</h2>
      <div className="h-[2px] mt-0.5" style={{ backgroundColor: theme.accent }} />
    </div>
  );
}

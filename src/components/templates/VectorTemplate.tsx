import type { ResumeData } from "@/types/resume";
import { createTemplateTheme, getDefaultTemplateAccent } from "@/lib/templateTheme";

interface Props {
  data: ResumeData;
  accentColor?: string;
}

// ─── Vector Template ──────────────────────────────────────────────────────────
// FAANG / big-tech standard format used by top-tier recruiters.
// Inspired by Resume.io Stockholm, Kickresume Prague, and Google/Microsoft
// resume guides — left-aligned name, left accent border on header,
// inline accent rule headings, skills as plain text.  ATS: 97.
export default function VectorTemplate({ data, accentColor }: Props) {
  const { personalInfo, summary, workExperience, education, skills, certifications } = data;
  const theme = createTemplateTheme(accentColor ?? getDefaultTemplateAccent("vector"));

  return (
    <div className="font-sans text-gray-800 text-[12.5px] leading-relaxed max-w-[760px] mx-auto bg-white">

      {/* ── Header — left accent bar ─────────────────────────────────────────── */}
      <div
        className="flex"
        style={{ borderLeft: `5px solid ${theme.accent}` }}
      >
        <div className="px-8 py-6 flex-1">
          <h1 className="text-[28px] font-extrabold tracking-tight text-gray-900 leading-none">
            {personalInfo.fullName || "Your Name"}
          </h1>
          {personalInfo.jobTitle && (
            <p className="text-[13px] font-semibold mt-1.5" style={{ color: theme.accent }}>
              {personalInfo.jobTitle}
            </p>
          )}
          <div className="flex flex-wrap gap-x-5 gap-y-0.5 mt-2.5 text-[11px] text-gray-500">
            {personalInfo.email  && <span>{personalInfo.email}</span>}
            {personalInfo.phone  && <span>{personalInfo.phone}</span>}
            {personalInfo.location && <span>{personalInfo.location}</span>}
            {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
            {personalInfo.website  && <span>{personalInfo.website}</span>}
          </div>
        </div>
      </div>

      <div className="px-8 py-5 space-y-5">

        {/* ── Summary ────────────────────────────────────────────────────────── */}
        {summary && (
          <div>
            <VectorSection title="Professional Summary" theme={theme} />
            <p className="text-gray-700">{summary}</p>
          </div>
        )}

        {/* ── Experience ─────────────────────────────────────────────────────── */}
        {workExperience.length > 0 && (
          <div>
            <VectorSection title="Work Experience" theme={theme} />
            <div className="space-y-4">
              {workExperience.map((w) => (
                <div key={w.id}>
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div>
                      <span className="font-bold text-gray-900">{w.title}</span>
                      {w.company && (
                        <span className="font-semibold ml-2" style={{ color: theme.accent }}>
                          {w.company}
                        </span>
                      )}
                      {w.location && (
                        <span className="text-gray-400 text-[11px] ml-2">
                          · {w.location}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap font-medium shrink-0 mt-0.5">
                      {w.startDate} – {w.endDate}
                    </span>
                  </div>
                  {w.description && (
                    <div
                      className="resume-desc text-gray-700 mt-0.5"
                      dangerouslySetInnerHTML={{ __html: w.description }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Education ──────────────────────────────────────────────────────── */}
        {education.length > 0 && (
          <div>
            <VectorSection title="Education" theme={theme} />
            <div className="space-y-2.5">
              {education.map((e) => (
                <div key={e.id} className="flex justify-between items-baseline gap-4 flex-wrap">
                  <div>
                    <span className="font-bold text-gray-900">
                      {e.degree}{e.field && ` in ${e.field}`}
                    </span>
                    {e.institution && (
                      <span className="ml-2 font-semibold" style={{ color: theme.accent }}>
                        {e.institution}
                      </span>
                    )}
                    {(e.gpa || e.honors) && (
                      <p className="text-gray-400 text-[11px] mt-0.5">
                        {[e.gpa && `GPA: ${e.gpa}`, e.honors].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400 whitespace-nowrap shrink-0">
                    {e.startDate} – {e.endDate}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Technical Skills ───────────────────────────────────────────────── */}
        {skills.length > 0 && (
          <div>
            <VectorSection title="Technical Skills" theme={theme} />
            {/* Plain-text dot-separated: 100% ATS-readable */}
            <p className="text-gray-700 leading-loose">{skills.join("  ·  ")}</p>
          </div>
        )}

        {/* ── Certifications ─────────────────────────────────────────────────── */}
        {certifications.length > 0 && (
          <div>
            <VectorSection title="Certifications" theme={theme} />
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {certifications.map((c) => (
                <div key={c.id} className="flex justify-between items-baseline gap-2">
                  <div className="min-w-0">
                    <span className="font-semibold text-gray-800 truncate">{c.name}</span>
                    {c.issuer && (
                      <span className="text-gray-400 text-[11px] ml-1.5">{c.issuer}</span>
                    )}
                  </div>
                  {!c.neverExpires && c.date && (
                    <span className="text-gray-400 text-[11px] whitespace-nowrap shrink-0">
                      {c.date}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Inline accent-bar section rule (Vector style) ────────────────────────────
function VectorSection({
  title,
  theme,
}: {
  title: string;
  theme: ReturnType<typeof createTemplateTheme>;
}) {
  return (
    <div className="flex items-center gap-3 mb-2.5">
      <div className="w-[3px] h-[14px] rounded-full shrink-0" style={{ backgroundColor: theme.accent }} />
      <h2 className="text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-gray-800 whitespace-nowrap">
        {title}
      </h2>
      <div className="flex-1 h-px" style={{ backgroundColor: theme.accentBorder }} />
    </div>
  );
}

import type { ResumeData } from "@/types/resume";
import { createTemplateTheme, getDefaultTemplateAccent } from "@/lib/templateTheme";
import HeadshotAvatar from "@/components/HeadshotAvatar";

interface Props { data: ResumeData; accentColor?: string }

function formatDateRange(startDate?: string, endDate?: string) {
  const parts = [startDate, endDate].filter(Boolean);
  return parts.join(" - ");
}

// ─── Chronos Template — timeline-style, vertical date rail, teal accents ──────
export default function ChronosTemplate({ data, accentColor }: Props) {
  const { personalInfo, summary, workExperience, education, skills, certifications } = data;
  const theme = createTemplateTheme(accentColor ?? getDefaultTemplateAccent("chronos"));

  return (
    <div className="font-sans text-gray-800 text-[12.5px] leading-relaxed max-w-[780px] mx-auto bg-white">
      {/* ── Header ── */}
      <div className="px-10 pt-8 pb-6 border-b-2" style={{ borderColor: theme.accent }}>
        <div className="flex justify-between items-end gap-6">
          <div className="flex items-end gap-4 min-w-0">
            <HeadshotAvatar
              headshotUrl={personalInfo.headshotUrl}
              initials={personalInfo.fullName ? personalInfo.fullName.charAt(0).toUpperCase() : "?"}
              alt={`${personalInfo.fullName || "Candidate"} headshot`}
              className="w-32 h-32 rounded-3xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100"
              fallbackClassName="h-full w-full flex items-center justify-center text-3xl font-bold text-gray-700"
            />
            <div className="min-w-0">
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                {personalInfo.fullName || "Your Name"}
              </h1>
              {personalInfo.jobTitle && (
                <p className="font-semibold text-sm mt-0.5 tracking-wide" style={{ color: theme.accent }}>
                  {personalInfo.jobTitle}
                </p>
              )}
            </div>
          </div>
          <div className="text-right text-xs text-gray-500 space-y-0.5 flex-shrink-0">
            {personalInfo.email && <div>{personalInfo.email}</div>}
            {personalInfo.phone && <div>{personalInfo.phone}</div>}
            {personalInfo.location && <div>{personalInfo.location}</div>}
            {personalInfo.linkedin && (
              <div style={{ color: theme.accent }}>{personalInfo.linkedin}</div>
            )}
            {personalInfo.website && (
              <div style={{ color: theme.accent }}>{personalInfo.website}</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-10 py-6 grid grid-cols-[1fr_220px] gap-8">
        {/* Left — main content */}
        <div>
          {/* Summary */}
          {summary && (
            <div className="mb-6">
              <SectionHeading theme={theme}>Profile</SectionHeading>
              <p className="text-gray-700 leading-relaxed">{summary}</p>
            </div>
          )}

          {/* Experience — timeline */}
          {workExperience.length > 0 && (
            <div className="mb-6">
              <SectionHeading theme={theme}>Experience</SectionHeading>
              <div className="relative">
                {/* Vertical rail */}
                <div className="absolute left-[6px] top-1 bottom-1 w-px" style={{ backgroundColor: theme.accentBorder }} />
                <div className="space-y-4">
                  {workExperience.map((w) => (
                    <div key={w.id} className="flex gap-3">
                      {/* Dot */}
                      <div className="flex-shrink-0 w-3 flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full border-2 border-white mt-0.5 z-10" style={{ backgroundColor: theme.accent, boxShadow: `0 0 0 2px ${theme.accentBorder}` }} />
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0 pb-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="font-bold text-gray-900 leading-snug">{w.title}</div>
                          {formatDateRange(w.startDate, w.endDate) && (
                            <div
                              className="rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-gray-500"
                              style={{ borderColor: theme.accentBorder, backgroundColor: "#ffffff" }}
                            >
                              {formatDateRange(w.startDate, w.endDate)}
                            </div>
                          )}
                        </div>
                        <div className="mt-0.5 text-[11px] font-semibold" style={{ color: theme.accent }}>
                          {w.company}
                          {w.location ? ` · ${w.location}` : ""}
                        </div>
                        {w.description && (
                          <div
                            className="mt-1 text-gray-600 resume-desc"
                            dangerouslySetInnerHTML={{ __html: w.description }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Education */}
          {education.length > 0 && (
            <div>
              <SectionHeading theme={theme}>Education</SectionHeading>
              <div className="relative">
                <div className="absolute left-[6px] top-1 bottom-1 w-px" style={{ backgroundColor: theme.accentBorder }} />
                <div className="space-y-3.5">
                  {education.map((e) => (
                    <div key={e.id} className="flex gap-3">
                      <div className="flex-shrink-0 w-3 flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full border-2 border-white mt-0.5 z-10" style={{ backgroundColor: theme.accentSoft, boxShadow: `0 0 0 2px ${theme.accentBorder}` }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="font-bold text-gray-900 leading-snug">
                            {e.degree}{e.field ? ` in ${e.field}` : ""}
                          </div>
                          {formatDateRange(e.startDate, e.endDate) && (
                            <div
                              className="rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-gray-500"
                              style={{ borderColor: theme.accentBorder, backgroundColor: "#ffffff" }}
                            >
                              {formatDateRange(e.startDate, e.endDate)}
                            </div>
                          )}
                        </div>
                        <div className="mt-0.5 text-[11px] font-medium" style={{ color: theme.accent }}>{e.institution}</div>
                        {(e.gpa || e.honors) && (
                          <div className="text-gray-500 text-[11px] mt-0.5">
                            {[e.honors, e.gpa ? `GPA: ${e.gpa}` : ""].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right — skills & certs */}
        <div>
          {skills.length > 0 && (
            <div className="mb-6">
              <SectionHeading theme={theme}>Skills</SectionHeading>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                    style={{ backgroundColor: theme.accent, color: theme.contrast, border: `1px solid ${theme.accentDeep}` }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {certifications.length > 0 && (
            <div>
              <SectionHeading theme={theme}>Certifications</SectionHeading>
              <div className="space-y-2">
                {certifications.map((c) => (
                  <div key={c.id} className="text-xs space-y-0.5">
                    <div className="font-semibold text-gray-800">{c.name}</div>
                    <div className="text-gray-500">{c.issuer}</div>
                    {!c.neverExpires && c.validTo && (
                      <div className="text-gray-400 text-[11px]">{c.validTo}</div>
                    )}
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

function SectionHeading({ children, theme }: { children: React.ReactNode; theme: ReturnType<typeof createTemplateTheme> }) {
  return (
    <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 border-b pb-1" style={{ color: theme.accent, borderColor: theme.accentBorder }}>
      {children}
    </h2>
  );
}

import type { ResumeData } from "@/types/resume";
import { createTemplateTheme, getDefaultTemplateAccent } from "@/lib/templateTheme";
import HeadshotAvatar from "@/components/HeadshotAvatar";

interface Props { data: ResumeData; accentColor?: string }

// ─── Slate Template — two-column, slate sidebar, white main ──────────────────
export default function SlateTemplate({ data, accentColor }: Props) {
  const { personalInfo, summary, workExperience, education, skills, certifications } = data;
  const theme = createTemplateTheme(accentColor ?? getDefaultTemplateAccent("slate"));

  const initials = personalInfo.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="font-sans text-[12.5px] leading-relaxed max-w-[780px] mx-auto bg-white flex min-h-[900px]">
      {/* ── Left Sidebar ── */}
      <div className="w-64 flex-shrink-0 bg-slate-800 text-white flex flex-col">
        {/* Avatar + name */}
        <div className="px-6 pt-8 pb-6 border-b border-slate-700">
          <HeadshotAvatar
            headshotUrl={personalInfo.headshotUrl}
            initials={initials || "?"}
            alt={`${personalInfo.fullName || "Candidate"} headshot`}
            className="w-32 h-32 rounded-3xl overflow-hidden mb-5"
            fallbackClassName="h-full w-full flex items-center justify-center text-3xl font-bold text-white"
            style={{ backgroundColor: theme.accent, color: theme.contrast }}
          />
          <h1 className="text-base font-bold leading-tight text-white">
            {personalInfo.fullName || "Your Name"}
          </h1>
          {personalInfo.jobTitle && (
            <p className="text-xs mt-1 leading-snug" style={{ color: theme.accentSofter }}>
              {personalInfo.jobTitle}
            </p>
          )}
        </div>

        {/* Contact */}
        <div className="px-5 py-5 border-b border-slate-700">
            <h2 className="text-[9px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: theme.accentSofter }}>
            Contact
          </h2>
          <div className="space-y-2 text-xs" style={{ color: theme.accentSofter }}>
            {personalInfo.email && (
              <div className="flex items-start gap-2">
                <span className="mt-px" style={{ color: theme.accentSofter }}>✉</span>
                <span className="break-all">{personalInfo.email}</span>
              </div>
            )}
            {personalInfo.phone && (
              <div className="flex items-start gap-2">
                <span className="mt-px" style={{ color: theme.accentSofter }}>✆</span>
                <span>{personalInfo.phone}</span>
              </div>
            )}
            {personalInfo.location && (
              <div className="flex items-start gap-2">
                <span className="mt-px" style={{ color: theme.accentSofter }}>⊙</span>
                <span>{personalInfo.location}</span>
              </div>
            )}
            {personalInfo.linkedin && (
              <div className="flex items-start gap-2">
                <span className="mt-px" style={{ color: theme.accentSofter }}>in</span>
                <span className="break-all text-[11px]">{personalInfo.linkedin}</span>
              </div>
            )}
            {personalInfo.website && (
              <div className="flex items-start gap-2">
                <span className="mt-px" style={{ color: theme.accentSofter }}>🌐</span>
                <span className="break-all text-[11px]">{personalInfo.website}</span>
              </div>
            )}
          </div>
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="px-5 py-5 border-b border-slate-700">
            <h2 className="text-[9px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: theme.accentSofter }}>
              Skills
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <span key={s} className="text-[10px] rounded px-2 py-0.5 leading-tight" style={{ backgroundColor: theme.accent, color: theme.contrast }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Education (sidebar) */}
        {education.length > 0 && (
          <div className="px-5 py-5 border-b border-slate-700">
            <h2 className="text-[9px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: theme.accentSofter }}>
              Education
            </h2>
            <div className="space-y-3">
              {education.map((e) => (
                <div key={e.id}>
                  <p className="text-xs font-semibold text-white leading-tight">
                    {e.degree}{e.field ? ` in ${e.field}` : ""}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: theme.accentSofter }}>{e.institution}</p>
                  <p className="text-[10px]" style={{ color: theme.accentMuted }}>
                    {e.startDate} – {e.endDate}
                    {e.gpa ? ` · GPA ${e.gpa}` : ""}
                  </p>
                  {e.honors && <p className="text-[10px]" style={{ color: theme.accent }}>{e.honors}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <div className="px-5 py-5">
            <h2 className="text-[9px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: theme.accentSofter }}>
              Certifications
            </h2>
            <div className="space-y-2">
              {certifications.map((c) => (
                <div key={c.id} className="space-y-0.5">
                  <p className="text-xs font-medium leading-tight" style={{ color: theme.contrast }}>{c.name}</p>
                  <p className="text-[10px]" style={{ color: theme.accentMuted }}>{c.issuer}</p>
                  {!c.neverExpires && c.validTo && (
                    <p className="text-[10px]" style={{ color: theme.accentMuted }}>{c.validTo}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 px-8 py-8 bg-white">
        {/* Sky accent bar under top */}
        <div className="h-1 w-12 rounded-full mb-6" style={{ backgroundColor: theme.accent }} />

        {/* Summary */}
        {summary && (
          <div className="mb-6">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: theme.accent }}>
              Profile
            </h2>
            <p className="text-gray-700 leading-relaxed">{summary}</p>
          </div>
        )}

        {/* Experience */}
        {workExperience.length > 0 && (
          <div className="mb-6">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] border-b pb-1.5 mb-4" style={{ color: theme.accent, borderColor: theme.accentBorder }}>
              Work Experience
            </h2>
            <div className="space-y-5">
              {workExperience.map((w) => (
                <div key={w.id}>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="font-bold text-slate-900">{w.title}</p>
                      <p className="text-xs font-medium mt-0.5" style={{ color: theme.accent }}>
                        {[w.company, w.location].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                      {w.startDate} – {w.endDate}
                    </span>
                  </div>
                  {w.description && (
                    <div
                      className="resume-desc text-gray-600 mt-1"
                      dangerouslySetInnerHTML={{ __html: w.description }}
                    />
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

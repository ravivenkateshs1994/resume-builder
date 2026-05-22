import type { ResumeData } from "@/types/resume";
import { createTemplateTheme, getDefaultTemplateAccent } from "@/lib/templateTheme";
import HeadshotAvatar from "@/components/HeadshotAvatar";

interface Props { data: ResumeData; accentColor?: string }

// ─── Creative Template — sidebar layout, bold colors ──────────────────────────
export default function CreativeTemplate({ data, accentColor }: Props) {
  const { personalInfo, summary, workExperience, education, skills, certifications } = data;
  const theme = createTemplateTheme(accentColor ?? getDefaultTemplateAccent("creative"));

  return (
    <div className="font-sans text-[12.5px] leading-relaxed max-w-[780px] mx-auto bg-white flex min-h-[900px]">
      {/* Sidebar */}
      <div className="w-64 px-5 py-8 flex-shrink-0" style={{ backgroundColor: theme.accentDeep, color: theme.contrastDeep }}>
        <div className="mb-6">
          <HeadshotAvatar
            headshotUrl={personalInfo.headshotUrl}
            initials={personalInfo.fullName?.charAt(0) || "?"}
            alt={`${personalInfo.fullName || "Candidate"} headshot`}
            className="w-20 h-20 rounded-2xl overflow-hidden mb-3 border border-white/10 bg-white/10"
            fallbackClassName="h-full w-full flex items-center justify-center text-2xl font-bold"
            style={{ backgroundColor: theme.accent, color: theme.contrast }}
          />
          <h1 className="text-lg font-bold leading-tight">
            {personalInfo.fullName || "Your Name"}
          </h1>
          {personalInfo.jobTitle && (
            <p className="text-xs mt-1" style={{ color: theme.accentSofter }}>
              {personalInfo.jobTitle}
            </p>
          )}
        </div>

        {/* Contact */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: theme.accentSofter }}>
            Contact
          </h2>
          <div className="space-y-1.5 text-xs" style={{ color: theme.accentSofter }}>
            {personalInfo.email && <p>{personalInfo.email}</p>}
            {personalInfo.phone && <p>{personalInfo.phone}</p>}
            {personalInfo.location && <p>{personalInfo.location}</p>}
            {personalInfo.linkedin && <p className="break-all">{personalInfo.linkedin}</p>}
            {personalInfo.website && <p className="break-all">{personalInfo.website}</p>}
          </div>
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: theme.accentSofter }}>
              Skills
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <span key={s} className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: theme.accent, color: theme.contrast }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: theme.accentSofter }}>
              Certifications
            </h2>
            <div className="space-y-2 text-xs" style={{ color: theme.accentSofter }}>
              {certifications.map((c) => (
                <div key={c.id} className="space-y-0.5">
                  <p className="font-medium">{c.name}</p>
                  <p style={{ color: theme.accentSofter }}>{c.issuer}</p>
                  {!c.neverExpires && c.validTo && (
                    <p className="text-[10px]" style={{ color: theme.accentSofter }}>
                      {c.validTo}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 px-7 py-8 text-gray-800">
        {/* Summary */}
        {summary && (
          <div className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest border-b-2 pb-1 mb-2" style={{ color: theme.accentDeep, borderColor: theme.accentBorder }}>
              About Me
            </h2>
            <p className="text-gray-700">{summary}</p>
          </div>
        )}

        {/* Experience */}
        {workExperience.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest border-b-2 pb-1 mb-3" style={{ color: theme.accentDeep, borderColor: theme.accentBorder }}>
              Experience
            </h2>
            {workExperience.map((w) => (
              <div key={w.id} className="mb-4">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-gray-900">{w.title}</span>
                  <span className="text-gray-400 text-xs">
                    {w.startDate} – {w.endDate}
                  </span>
                </div>
                <p className="text-xs font-medium" style={{ color: theme.accent }}>
                  {[w.company, w.location].filter(Boolean).join(" · ")}
                </p>
                {w.description && (
                  <div className="resume-desc text-gray-700" dangerouslySetInnerHTML={{ __html: w.description }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest border-b-2 pb-1 mb-3" style={{ color: theme.accentDeep, borderColor: theme.accentBorder }}>
              Education
            </h2>
            {education.map((e) => (
              <div key={e.id} className="mb-3">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold">
                    {e.degree} {e.field && `in ${e.field}`}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {e.startDate} – {e.endDate}
                  </span>
                </div>
                <p className="text-xs" style={{ color: theme.accent }}>{e.institution}</p>
                {(e.gpa || e.honors) && (
                  <p className="text-gray-500 text-xs">
                    {[e.gpa && `GPA: ${e.gpa}`, e.honors].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

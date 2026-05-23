import type { ResumeData } from "@/types/resume";
import { createTemplateTheme, getDefaultTemplateAccent } from "@/lib/templateTheme";
import HeadshotAvatar from "@/components/HeadshotAvatar";

interface Props {
  data: ResumeData;
  accentColor?: string;
}

// ─── Prism Template — light accent-tinted sidebar, white main column ──────────
export default function PrismTemplate({ data, accentColor }: Props) {
  const { personalInfo, summary, workExperience, education, skills, certifications } = data;
  const theme = createTemplateTheme(accentColor ?? getDefaultTemplateAccent("prism"));

  const initials = personalInfo.fullName
    ? personalInfo.fullName
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("")
    : "?";

  return (
    <div
      className="font-sans text-gray-800 text-[13px] leading-relaxed max-w-[780px] mx-auto bg-white flex"
      style={{ minHeight: "1050px" }}
    >
      {/* ── Left sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className="w-[240px] flex-shrink-0 px-6 py-7"
        style={{ backgroundColor: theme.accentSofter }}
      >
        {/* Avatar */}
        <HeadshotAvatar
          headshotUrl={personalInfo.headshotUrl}
          initials={initials}
          alt={`${personalInfo.fullName || "Candidate"} headshot`}
          className="w-32 h-32 rounded-3xl overflow-hidden mb-5 mx-auto"
          fallbackClassName="h-full w-full flex items-center justify-center text-3xl font-bold select-none"
          style={{ backgroundColor: theme.accent, color: theme.contrast }}
        />

        {/* Name (in sidebar for narrow layouts) */}
        <div className="text-center mb-5">
          <p className="text-sm font-bold text-gray-900 leading-tight">
            {personalInfo.fullName || "Your Name"}
          </p>
          {personalInfo.jobTitle && (
            <p className="text-[11px] mt-0.5 font-medium" style={{ color: theme.accentDeep }}>
              {personalInfo.jobTitle}
            </p>
          )}
        </div>

        {/* Contact */}
        <div className="mb-5">
          <h3
            className="text-[9px] font-bold uppercase tracking-widest mb-2"
            style={{ color: theme.accent }}
          >
            Contact
          </h3>
          <div className="space-y-1 text-[11px] text-gray-600 break-all">
            {personalInfo.email && <p>{personalInfo.email}</p>}
            {personalInfo.phone && <p>{personalInfo.phone}</p>}
            {personalInfo.location && <p>{personalInfo.location}</p>}
            {personalInfo.linkedin && <p style={{ color: theme.accentDeep }}>{personalInfo.linkedin}</p>}
            {personalInfo.website && <p style={{ color: theme.accentDeep }}>{personalInfo.website}</p>}
          </div>
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mb-5">
            <h3
              className="text-[9px] font-bold uppercase tracking-widest mb-2"
              style={{ color: theme.accent }}
            >
              Skills
            </h3>
            <div className="flex flex-col gap-1">
              {skills.map((s) => (
                <span
                  key={s}
                  className="text-[11px] px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: theme.accentSoft,
                    color: theme.accentDeep,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div>
            <h3
              className="text-[9px] font-bold uppercase tracking-widest mb-2"
              style={{ color: theme.accent }}
            >
              Education
            </h3>
            {education.map((e) => (
              <div key={e.id} className="mb-3 text-[11px]">
                <p className="font-semibold text-gray-800 leading-tight">
                  {e.degree} {e.field && `in ${e.field}`}
                </p>
                <p className="text-gray-500">{e.institution}</p>
                <p className="text-gray-400">
                  {e.startDate} – {e.endDate}
                </p>
                {(e.gpa || e.honors) && (
                  <p className="text-gray-400">
                    {[e.gpa && `GPA: ${e.gpa}`, e.honors].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────────── */}
      <main className="flex-1 px-7 py-7">
        {/* Top accent stripe */}
        <div className="h-1 rounded mb-5" style={{ backgroundColor: theme.accent }} />

        {/* Summary */}
        {summary && (
          <div className="mb-6">
            <h2
              className="text-[11px] font-bold uppercase tracking-[0.18em] mb-2"
              style={{ color: theme.accent }}
            >
              Professional Summary
            </h2>
            <p className="text-gray-700 leading-relaxed">{summary}</p>
          </div>
        )}

        {/* Experience */}
        {workExperience.length > 0 && (
          <div className="mb-6">
            <h2
              className="text-[11px] font-bold uppercase tracking-[0.18em] mb-3"
              style={{ color: theme.accent }}
            >
              Work Experience
            </h2>
            {workExperience.map((w) => (
              <div key={w.id} className="mb-5">
                <div className="flex justify-between items-baseline gap-3 flex-wrap">
                  <div>
                    <span className="font-semibold text-gray-900">{w.title}</span>
                    {w.company && (
                      <span className="ml-2 font-medium" style={{ color: theme.accent }}>
                        @ {w.company}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400 text-xs whitespace-nowrap">
                    {w.startDate} – {w.endDate}
                  </span>
                </div>
                {w.location && <p className="text-gray-400 text-xs">{w.location}</p>}
                {w.description && (
                  <div
                    className="resume-desc text-gray-700 mt-1"
                    dangerouslySetInnerHTML={{ __html: w.description }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <div>
            <h2
              className="text-[11px] font-bold uppercase tracking-[0.18em] mb-2"
              style={{ color: theme.accent }}
            >
              Certifications
            </h2>
            {certifications.map((c) => (
              <div key={c.id} className="space-y-0.5 text-sm mb-1.5">
                <div className="font-medium text-gray-800">{c.name}</div>
                <div className="text-gray-400 text-xs">{c.issuer}</div>
                {!c.neverExpires && c.validTo && (
                  <div className="text-gray-400 text-[10px]">{c.validTo}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

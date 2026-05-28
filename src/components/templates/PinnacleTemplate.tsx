import type { ResumeData } from "@/types/resume";
import { createTemplateTheme, getDefaultTemplateAccent } from "@/lib/templateTheme";

interface Props {
  data: ResumeData;
  accentColor?: string;
}

// ─── Pinnacle Template ────────────────────────────────────────────────────────
// Finance / consulting / prestige format.
// Centred header modelled after Harvard Business School and Big-4 resume guides.
// Serif body for authority; small-caps section rules; ATS: 97.
export default function PinnacleTemplate({ data, accentColor }: Props) {
  const { personalInfo, summary, workExperience, education, skills, certifications } = data;
  const theme = createTemplateTheme(accentColor ?? getDefaultTemplateAccent("pinnacle"));

  return (
    <div className="font-serif text-gray-800 text-[12.5px] leading-relaxed max-w-[760px] mx-auto bg-white px-10 py-8">

      {/* ── Centred header ───────────────────────────────────────────────────── */}
      <div className="text-center mb-1">
        <h1 className="text-[27px] font-bold tracking-wide text-gray-900 uppercase leading-tight">
          {personalInfo.fullName || "Your Name"}
        </h1>

        {personalInfo.jobTitle && (
          <p className="text-[12px] font-medium mt-1 tracking-wider" style={{ color: theme.accent }}>
            {personalInfo.jobTitle}
          </p>
        )}

        {/* Contact row — dot-separated */}
        <div className="flex flex-wrap justify-center items-center gap-x-1.5 gap-y-0.5 mt-2 text-[11px] text-gray-500">
          {[
            personalInfo.email,
            personalInfo.phone,
            personalInfo.location,
            personalInfo.linkedin,
            personalInfo.website,
          ]
            .filter(Boolean)
            .map((item, i, arr) => (
              <span key={i} className="flex items-center gap-1.5">
                {item}
                {i < arr.length - 1 && (
                  <span className="text-gray-300 select-none">·</span>
                )}
              </span>
            ))}
        </div>
      </div>

      {/* Accent rule */}
      <div className="my-3.5 h-[2px]" style={{ backgroundColor: theme.accent }} />

      {/* ── Summary ──────────────────────────────────────────────────────────── */}
      {summary && (
        <div className="mb-4">
          <PinnacleSection title="Summary" theme={theme} />
          <p className="text-gray-700 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* ── Experience ───────────────────────────────────────────────────────── */}
      {workExperience.length > 0 && (
        <div className="mb-4">
          <PinnacleSection title="Experience" theme={theme} />
          {workExperience.map((w) => (
            <div key={w.id} className="mb-4 last:mb-0">
              <div className="flex justify-between items-baseline gap-4 flex-wrap">
                <div>
                  <span className="font-bold text-gray-900">{w.title}</span>
                  {w.company && (
                    <span className="ml-2 italic text-gray-700">{w.company}</span>
                  )}
                </div>
                <span className="text-[11px] text-gray-400 whitespace-nowrap shrink-0">
                  {w.startDate} – {w.endDate}
                </span>
              </div>
              {w.location && (
                <p className="text-gray-400 text-[11px] italic mb-0.5">{w.location}</p>
              )}
              {w.description && (
                <div
                  className="resume-desc text-gray-700 mt-0.5"
                  dangerouslySetInnerHTML={{ __html: w.description }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Education ────────────────────────────────────────────────────────── */}
      {education.length > 0 && (
        <div className="mb-4">
          <PinnacleSection title="Education" theme={theme} />
          {education.map((e) => (
            <div key={e.id} className="mb-2.5 last:mb-0">
              <div className="flex justify-between items-baseline gap-4 flex-wrap">
                <div>
                  <span className="font-bold text-gray-900">
                    {e.degree}{e.field && ` in ${e.field}`}
                  </span>
                  {e.institution && (
                    <span className="ml-2 italic text-gray-600">{e.institution}</span>
                  )}
                </div>
                <span className="text-[11px] text-gray-400 whitespace-nowrap shrink-0">
                  {e.startDate} – {e.endDate}
                </span>
              </div>
              {(e.gpa || e.honors) && (
                <p className="text-gray-400 text-[11px]">
                  {[e.gpa && `GPA: ${e.gpa}`, e.honors].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Skills ───────────────────────────────────────────────────────────── */}
      {skills.length > 0 && (
        <div className="mb-4">
          <PinnacleSection title="Skills" theme={theme} />
          {/* Plain text: maximally ATS-readable */}
          <p className="text-gray-700 leading-relaxed">{skills.join("  ·  ")}</p>
        </div>
      )}

      {/* ── Certifications ───────────────────────────────────────────────────── */}
      {certifications.length > 0 && (
        <div>
          <PinnacleSection title="Certifications" theme={theme} />
          {certifications.map((c) => (
            <div
              key={c.id}
              className="mb-1.5 last:mb-0 flex justify-between items-baseline gap-4 flex-wrap"
            >
              <div>
                <span className="font-semibold text-gray-900">{c.name}</span>
                {c.issuer && (
                  <span className="ml-2 italic text-gray-500">{c.issuer}</span>
                )}
              </div>
              {!c.neverExpires && c.date && (
                <span className="text-[11px] text-gray-400 whitespace-nowrap shrink-0">
                  {c.date}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Small-caps section rule (Pinnacle style) ─────────────────────────────────
function PinnacleSection({
  title,
  theme,
}: {
  title: string;
  theme: ReturnType<typeof createTemplateTheme>;
}) {
  return (
    <div className="mb-2">
      <h2
        className="text-[10.5px] font-bold tracking-[0.2em] uppercase"
        style={{ color: theme.accentDeep }}
      >
        {title}
      </h2>
      <div className="h-px mt-0.5" style={{ backgroundColor: theme.accentBorder }} />
    </div>
  );
}

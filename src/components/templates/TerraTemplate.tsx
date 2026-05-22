import type { ResumeData } from "@/types/resume";
import { createTemplateTheme, getDefaultTemplateAccent } from "@/lib/templateTheme";

interface Props { data: ResumeData; accentColor?: string }

// ─── Terra Template — warm earthy tones, amber/terracotta accents ─────────────
export default function TerraTemplate({ data, accentColor }: Props) {
  const { personalInfo, summary, workExperience, education, skills, certifications } = data;
  const theme = createTemplateTheme(accentColor ?? getDefaultTemplateAccent("terra"));

  return (
    <div className="font-serif text-gray-800 text-[12.5px] leading-relaxed max-w-[780px] mx-auto bg-[#fdf8f3]">
      {/* ── Header ── */}
      <div className="px-10 py-8" style={{ backgroundColor: theme.accentDeep, color: theme.contrastDeep }}>
        <h1 className="text-[28px] font-bold tracking-tight leading-tight">
          {personalInfo.fullName || "Your Name"}
        </h1>
        {personalInfo.jobTitle && (
          <p className="text-sm font-medium mt-1 tracking-wider uppercase" style={{ color: theme.accentSofter }}>
            {personalInfo.jobTitle}
          </p>
        )}
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-4 text-xs" style={{ color: theme.accentSofter }}>
          {personalInfo.email && <span>✉ {personalInfo.email}</span>}
          {personalInfo.phone && <span>✆ {personalInfo.phone}</span>}
          {personalInfo.location && <span>⊙ {personalInfo.location}</span>}
          {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
          {personalInfo.website && <span>{personalInfo.website}</span>}
        </div>
      </div>

      {/* Amber stripe */}
      <div className="h-1.5" style={{ backgroundColor: theme.accent }} />

      {/* ── Body ── */}
      <div className="px-10 py-7 grid grid-cols-[1fr_200px] gap-8">
        {/* Left — main */}
        <div>
          {summary && (
            <div className="mb-6">
              <TerraSection title="About Me" theme={theme} />
              <p className="text-gray-700 leading-relaxed">{summary}</p>
            </div>
          )}

          {workExperience.length > 0 && (
            <div className="mb-6">
              <TerraSection title="Experience" theme={theme} />
              <div className="space-y-5">
                {workExperience.map((w) => (
                  <div key={w.id}>
                    <div className="flex justify-between items-baseline gap-2">
                      <div>
                        <span className="font-bold text-gray-900">{w.title}</span>
                        {w.company && (
                            <span className="font-semibold text-xs ml-2" style={{ color: theme.accent }}>
                            @ {w.company}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 flex-shrink-0 font-sans">
                        {[w.startDate, w.endDate].filter(Boolean).join(" – ")}
                      </span>
                    </div>
                    {w.location && (
                      <div className="text-xs text-gray-400 font-sans mt-0.5">{w.location}</div>
                    )}
                    {w.description && (
                      <div
                        className="mt-1.5 text-gray-600 resume-desc"
                        dangerouslySetInnerHTML={{ __html: w.description }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {education.length > 0 && (
            <div>
              <TerraSection title="Education" theme={theme} />
              <div className="space-y-3">
                {education.map((e) => (
                  <div key={e.id} className="flex justify-between gap-2">
                    <div>
                      <div className="font-bold text-gray-900">
                        {e.degree}{e.field ? ` in ${e.field}` : ""}
                      </div>
                      <div className="text-xs font-semibold" style={{ color: theme.accent }}>{e.institution}</div>
                      {(e.gpa || e.honors) && (
                        <div className="text-xs text-gray-500 font-sans">
                          {[e.honors, e.gpa ? `GPA ${e.gpa}` : ""].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400 flex-shrink-0 font-sans text-right">
                      {[e.startDate, e.endDate].filter(Boolean).join(" – ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — skills & certs */}
        <div>
          {skills.length > 0 && (
            <div className="mb-6">
              <TerraSection title="Skills" theme={theme} />
              <div className="space-y-1.5">
                {skills.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: theme.accent }} />
                    <span className="text-gray-700 text-xs">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {certifications.length > 0 && (
            <div>
              <TerraSection title="Certifications" theme={theme} />
              <div className="space-y-2.5">
                {certifications.map((c) => (
                  <div key={c.id} className="space-y-0.5">
                    <div className="font-bold text-gray-900 text-xs leading-snug">{c.name}</div>
                    <div className="text-gray-500 text-[11px] font-sans">{c.issuer}</div>
                    {!c.neverExpires && c.validTo && (
                      <div className="text-gray-400 text-[11px] font-sans">{c.validTo}</div>
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

function TerraSection({ title, theme }: { title: string; theme: ReturnType<typeof createTemplateTheme> }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h2 className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: theme.accent }}>{title}</h2>
      <div className="flex-1 h-px" style={{ backgroundColor: theme.accentBorder }} />
    </div>
  );
}

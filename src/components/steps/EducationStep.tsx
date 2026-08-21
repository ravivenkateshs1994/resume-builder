"use client";

import { useResumeStore } from "@/store/resumeStore";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 1969 }, (_, i) => (THIS_YEAR - i).toString());
const FUTURE_YEARS = Array.from({ length: 31 }, (_, i) => (THIS_YEAR + i).toString());

function MonthYearSelect({
  value,
  onChange,
  disabled,
  futureOnly,
  idPrefix,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  futureOnly?: boolean;
  idPrefix?: string;
}) {
  const parts = value?.split(" ") ?? [];
  const month = MONTHS.includes(parts[0]) ? parts[0] : "";
  const year = parts[1] ?? (YEARS.includes(parts[0]) ? parts[0] : "");

  function update(m: string, y: string) {
    if (m && y) onChange(`${m} ${y}`);
    else if (m) onChange(m);
    else if (y) onChange(y);
    else onChange("");
  }

  const selectClass =
    "flex-1 border border-slate-200 rounded-lg px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400";

  return (
    <div className="flex flex-col gap-2 md:flex-row">
      <select id={typeof idPrefix === "string" ? `${idPrefix}-month` : undefined} value={month} onChange={(e) => update(e.target.value, year)} disabled={disabled} className={selectClass}>
        <option value="">Month</option>
        {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      <select id={typeof idPrefix === "string" ? `${idPrefix}-year` : undefined} value={(futureOnly ? FUTURE_YEARS : YEARS).includes(year) ? year : ""} onChange={(e) => update(month, e.target.value)} disabled={disabled} className={selectClass}>
        <option value="">Year</option>
        {(futureOnly ? FUTURE_YEARS : YEARS).map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

export default function EducationStep() {
  const {
    resumeData,
    addEducation,
    updateEducation,
    removeEducation,
    addCertification,
    updateCertification,
    removeCertification,
    nextStep,
    prevStep,
  } = useResumeStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-[22px] font-bold text-slate-100 md:text-[30px]">Education & Certifications</h2>
        <p className="mb-0 break-words text-sm text-slate-300 md:text-base">Add your academic background and credentials.</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Education</h3>
        {resumeData.education.map((e, idx) => {
          const isCurrent = e.endDate === "Present";
          return (
            <div key={e.id} className="max-w-full overflow-hidden rounded-2xl border border-white/10 bg-white/3">
              <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-slate-950/40 px-4 py-3">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Education {idx + 1}</span>
                <button type="button" onClick={() => removeEducation(e.id)} className="min-h-[44px] px-2 text-xs font-medium text-red-300 hover:text-red-200 md:min-h-0 md:px-0">Remove</button>
              </div>
              <div className="space-y-4 p-4 md:p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor={`institution-${e.id}`} className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-300">Institution <span className="text-red-400">*</span></label>
                    <input id={`institution-${e.id}`} value={e.institution} onChange={(v) => updateEducation(e.id, { institution: v.target.value })} placeholder="e.g. New York University" className="crp-input" />
                  </div>
                  <div>
                    <label htmlFor={`degree-${e.id}`} className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-300">Degree</label>
                    <input id={`degree-${e.id}`} value={e.degree} onChange={(v) => updateEducation(e.id, { degree: v.target.value })} placeholder="e.g. Bachelor of Science" className="crp-input" />
                  </div>
                  <div>
                    <label htmlFor={`field-${e.id}`} className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-300">Field of Study</label>
                    <input id={`field-${e.id}`} value={e.field} onChange={(v) => updateEducation(e.id, { field: v.target.value })} placeholder="e.g. Computer Science" className="crp-input" />
                  </div>
                  <div>
                    <label htmlFor={`gpa-${e.id}`} className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-300">GPA <span className="font-normal normal-case text-slate-400">(optional)</span></label>
                    <input id={`gpa-${e.id}`} value={e.gpa || ""} onChange={(v) => updateEducation(e.id, { gpa: v.target.value })} placeholder="e.g. 3.8" className="crp-input" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor={`edu-${e.id}-start-month`} className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-300">Start Date</label>
                    <MonthYearSelect idPrefix={`edu-${e.id}-start`} value={e.startDate} onChange={(v) => updateEducation(e.id, { startDate: v })} />
                  </div>
                  <div>
                    <label htmlFor={`edu-${e.id}-end-month`} className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-300">End Date</label>
                    <MonthYearSelect idPrefix={`edu-${e.id}-end`} value={isCurrent ? "" : e.endDate} onChange={(v) => updateEducation(e.id, { endDate: v })} disabled={isCurrent} />
                    <label className="mt-2 inline-flex cursor-pointer select-none items-center gap-2">
                      <input type="checkbox" checked={isCurrent} onChange={(ev) => updateEducation(e.id, { endDate: ev.target.checked ? "Present" : "" })} className="rounded border-slate-500 bg-slate-900 text-cyan-400 focus:ring-cyan-500" />
                      <span className="text-xs text-slate-300">Currently studying here</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label htmlFor={`honors-${e.id}`} className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-300">Honors / Awards <span className="font-normal normal-case text-slate-400">(optional)</span></label>
                  <input id={`honors-${e.id}`} value={e.honors || ""} onChange={(v) => updateEducation(e.id, { honors: v.target.value })} placeholder="e.g. Magna Cum Laude, Dean's List" className="crp-input" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <button type="button" onClick={addEducation} className="mt-3 min-h-[44px] w-full rounded-xl border-2 border-dashed border-white/10 bg-white/3 py-3 text-sm font-medium text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-cyan-100">
        + Add Education
      </button>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-200 mt-8 mb-3">Certifications</h3>
        {resumeData.certifications.map((c, idx) => (
          <div key={c.id} className="max-w-full overflow-hidden rounded-2xl border border-white/10 bg-white/3">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-slate-950/40 px-4 py-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Certification {idx + 1}</span>
              <button type="button" onClick={() => removeCertification(c.id)} className="min-h-[44px] px-2 text-xs font-medium text-red-300 hover:text-red-200 md:min-h-0 md:px-0">Remove</button>
            </div>
            <div className="space-y-4 p-4 md:p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor={`cert-name-${c.id}`} className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-300">Certification Name</label>
                  <input id={`cert-name-${c.id}`} value={c.name} onChange={(v) => updateCertification(c.id, { name: v.target.value })} placeholder="e.g. AWS Solutions Architect" className="crp-input" />
                </div>
                <div>
                  <label htmlFor={`cert-issuer-${c.id}`} className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-300">Issuing Organization</label>
                  <input id={`cert-issuer-${c.id}`} value={c.issuer} onChange={(v) => updateCertification(c.id, { issuer: v.target.value })} placeholder="e.g. Amazon" className="crp-input" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor={`cert-cred-${c.id}`} className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-300">Credential ID</label>
                  <input id={`cert-cred-${c.id}`} value={c.credentialId ?? ""} onChange={(v) => updateCertification(c.id, { credentialId: v.target.value })} placeholder="e.g. ABC-123456" className="crp-input" />
                </div>
                <div>
                  <label htmlFor={`cert-issue-${c.id}-month`} className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-300">Issue Date</label>
                  <MonthYearSelect idPrefix={`cert-issue-${c.id}`} value={c.validFrom ?? c.date} onChange={(v) => updateCertification(c.id, { validFrom: v, date: v })} />
                </div>
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
                <div className="flex-1">
                  <label htmlFor={`cert-expiry-${c.id}-month`} className={`mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide ${c.neverExpires ? "text-slate-400" : "text-slate-300"}`}>Expiry Date</label>
                  <MonthYearSelect idPrefix={`cert-expiry-${c.id}`} value={c.neverExpires ? "" : (c.validTo ?? "")} onChange={(v) => updateCertification(c.id, { validTo: v })} disabled={!!c.neverExpires} futureOnly />
                </div>
                <div className="w-full pb-0 md:w-auto md:flex-shrink-0 md:pb-2">
                  <label className="flex cursor-pointer select-none items-center gap-2">
                    <button
                      type="button"
                      aria-pressed={c.neverExpires}
                      onClick={() => updateCertification(c.id, { neverExpires: !c.neverExpires, validTo: !c.neverExpires ? "" : c.validTo })}
                      className={`relative h-5 w-9 rounded-full transition-colors focus:outline-none focus:ring-2 ${ c.neverExpires ? "bg-cyan-500" : "bg-slate-600"}`}
                    >
                      <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${c.neverExpires ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                    <span className="break-words text-xs font-semibold uppercase tracking-wide text-slate-300">Never Expires</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={addCertification} className="mt-3 min-h-[44px] w-full rounded-xl border-2 border-dashed border-white/10 bg-white/3 py-3 text-sm font-medium text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-cyan-100">
        + Add Certification
      </button>

      <div className="mt-8 flex flex-col gap-3 md:flex-row md:justify-between">
        <button type="button" onClick={prevStep} className="crp-btn crp-btn-secondary min-h-[44px] w-full md:w-auto">
          Back
        </button>
        <button type="button" onClick={nextStep} className="crp-btn crp-btn-primary min-h-[44px] w-full md:w-auto">
          Next: Skills
        </button>
      </div>
    </div>
  );
}


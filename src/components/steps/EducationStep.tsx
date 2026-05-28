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
    <div>
      <h2 className="mb-1 text-[22px] font-bold text-slate-800 md:text-[30px]">Education & Certifications</h2>
      <p className="mb-6 break-words text-sm text-slate-500 md:text-base">Add your academic background and credentials.</p>

      <h3 className="text-sm font-semibold text-slate-700 mb-3">Education</h3>
      <div className="space-y-4">
        {resumeData.education.map((e, idx) => {
          const isCurrent = e.endDate === "Present";
          return (
            <div key={e.id} className="max-w-full overflow-hidden rounded-xl border border-slate-200">
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Education {idx + 1}</span>
                <button type="button" onClick={() => removeEducation(e.id)} className="min-h-[44px] px-2 text-xs font-medium text-red-400 hover:text-red-600 md:min-h-0 md:px-0">Remove</button>
              </div>
              <div className="space-y-4 p-4 md:p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor={`institution-${e.id}`} className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-600">Institution <span className="text-red-500">*</span></label>
                    <input id={`institution-${e.id}`} value={e.institution} onChange={(v) => updateEducation(e.id, { institution: v.target.value })} placeholder="e.g. New York University" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label htmlFor={`degree-${e.id}`} className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-600">Degree</label>
                    <input id={`degree-${e.id}`} value={e.degree} onChange={(v) => updateEducation(e.id, { degree: v.target.value })} placeholder="e.g. Bachelor of Science" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label htmlFor={`field-${e.id}`} className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-600">Field of Study</label>
                    <input id={`field-${e.id}`} value={e.field} onChange={(v) => updateEducation(e.id, { field: v.target.value })} placeholder="e.g. Computer Science" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label htmlFor={`gpa-${e.id}`} className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-600">GPA <span className="font-normal normal-case text-gray-400">(optional)</span></label>
                    <input id={`gpa-${e.id}`} value={e.gpa || ""} onChange={(v) => updateEducation(e.id, { gpa: v.target.value })} placeholder="e.g. 3.8" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor={`edu-${e.id}-start-month`} className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-600">Start Date</label>
                    <MonthYearSelect idPrefix={`edu-${e.id}-start`} value={e.startDate} onChange={(v) => updateEducation(e.id, { startDate: v })} />
                  </div>
                  <div>
                    <label htmlFor={`edu-${e.id}-end-month`} className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-600">End Date</label>
                    <MonthYearSelect idPrefix={`edu-${e.id}-end`} value={isCurrent ? "" : e.endDate} onChange={(v) => updateEducation(e.id, { endDate: v })} disabled={isCurrent} />
                    <label className="inline-flex items-center gap-2 mt-2 cursor-pointer select-none">
                      <input type="checkbox" checked={isCurrent} onChange={(ev) => updateEducation(e.id, { endDate: ev.target.checked ? "Present" : "" })} className="rounded border-slate-200 text-blue-600 focus:ring-blue-500" />
                      <span className="text-xs text-slate-600">Currently studying here</span>
                    </label>
                  </div>
                </div>
                  <div>
                    <label htmlFor={`honors-${e.id}`} className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-600">Honors / Awards <span className="font-normal normal-case text-gray-400">(optional)</span></label>
                    <input id={`honors-${e.id}`} value={e.honors || ""} onChange={(v) => updateEducation(e.id, { honors: v.target.value })} placeholder="e.g. Magna Cum Laude, Dean's List" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
              </div>
            </div>
          );
        })}
      </div>
      <button type="button" onClick={addEducation} className="mt-3 min-h-[44px] w-full rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600">
        + Add Education
      </button>

      <h3 className="text-sm font-semibold text-slate-700 mt-8 mb-3">Certifications</h3>
      <div className="space-y-3">
        {resumeData.certifications.map((c, idx) => (
          <div key={c.id} className="max-w-full overflow-hidden rounded-xl border border-slate-200">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Certification {idx + 1}</span>
              <button type="button" onClick={() => removeCertification(c.id)} className="min-h-[44px] px-2 text-xs font-medium text-red-400 hover:text-red-600 md:min-h-0 md:px-0">Remove</button>
            </div>
            <div className="space-y-4 p-4 md:p-6">
              {/* Row 1 */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor={`cert-name-${c.id}`} className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-600">Certification Name</label>
                  <input id={`cert-name-${c.id}`} value={c.name} onChange={(v) => updateCertification(c.id, { name: v.target.value })} placeholder="e.g. AWS Solutions Architect" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor={`cert-issuer-${c.id}`} className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-600">Issuing Organization</label>
                  <input id={`cert-issuer-${c.id}`} value={c.issuer} onChange={(v) => updateCertification(c.id, { issuer: v.target.value })} placeholder="e.g. Amazon" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              {/* Row 2 */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor={`cert-cred-${c.id}`} className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-600">Credential ID</label>
                  <input id={`cert-cred-${c.id}`} value={c.credentialId ?? ""} onChange={(v) => updateCertification(c.id, { credentialId: v.target.value })} placeholder="e.g. ABC-123456" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor={`cert-issue-${c.id}-month`} className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-600">Issue Date</label>
                  <MonthYearSelect idPrefix={`cert-issue-${c.id}`} value={c.validFrom ?? c.date} onChange={(v) => updateCertification(c.id, { validFrom: v, date: v })} />
                </div>
              </div>
              {/* Row 3 - expiry */}
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
                <div className="flex-1">
                  <label htmlFor={`cert-expiry-${c.id}-month`} className={`mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide ${c.neverExpires ? "text-gray-300" : "text-gray-600"}`}>Expiry Date</label>
                  <MonthYearSelect idPrefix={`cert-expiry-${c.id}`} value={c.neverExpires ? "" : (c.validTo ?? "")} onChange={(v) => updateCertification(c.id, { validTo: v })} disabled={!!c.neverExpires} futureOnly />
                </div>
                <div className="w-full pb-0 md:w-auto md:flex-shrink-0 md:pb-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <button
                      type="button"
                      aria-pressed={c.neverExpires}
                      onClick={() => updateCertification(c.id, { neverExpires: !c.neverExpires, validTo: !c.neverExpires ? "" : c.validTo })}
                      className={`relative w-9 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 ${ c.neverExpires ? "bg-blue-600" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${c.neverExpires ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                    <span className="break-words text-xs font-semibold uppercase tracking-wide text-slate-600">Never Expires</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={addCertification} className="mt-3 min-h-[44px] w-full rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600">
        + Add Certification
      </button>

      <div className="mt-8 flex flex-col gap-3 md:flex-row md:justify-between">
        <button type="button" onClick={prevStep} className="min-h-[44px] w-full rounded-lg border border-slate-200 px-5 py-2.5 font-medium text-slate-600 transition-colors hover:bg-slate-50 md:w-auto">
          Back
        </button>
        <button type="button" onClick={nextStep} className="min-h-[44px] w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 font-medium text-white transition-colors hover:from-blue-700 hover:to-indigo-700 md:w-auto">
          Next: Skills
        </button>
      </div>
    </div>
  );
}


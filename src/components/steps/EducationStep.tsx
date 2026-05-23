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
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  futureOnly?: boolean;
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
    <div className="flex gap-2">
      <select value={month} onChange={(e) => update(e.target.value, year)} disabled={disabled} className={selectClass}>
        <option value="">Month</option>
        {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      <select value={(futureOnly ? FUTURE_YEARS : YEARS).includes(year) ? year : ""} onChange={(e) => update(month, e.target.value)} disabled={disabled} className={selectClass}>
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
      <h2 className="text-xl font-bold text-slate-800 mb-1">Education & Certifications</h2>
      <p className="text-sm text-slate-500 mb-6">Add your academic background and credentials.</p>

      <h3 className="text-sm font-semibold text-slate-700 mb-3">Education</h3>
      <div className="space-y-4">
        {resumeData.education.map((e, idx) => {
          const isCurrent = e.endDate === "Present";
          return (
            <div key={e.id} className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Education {idx + 1}</span>
                <button onClick={() => removeEducation(e.id)} className="text-red-400 hover:text-red-600 text-xs font-medium">Remove</button>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Institution <span className="text-red-500">*</span></label>
                    <input value={e.institution} onChange={(v) => updateEducation(e.id, { institution: v.target.value })} placeholder="e.g. New York University" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Degree</label>
                    <input value={e.degree} onChange={(v) => updateEducation(e.id, { degree: v.target.value })} placeholder="e.g. Bachelor of Science" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Field of Study</label>
                    <input value={e.field} onChange={(v) => updateEducation(e.id, { field: v.target.value })} placeholder="e.g. Computer Science" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">GPA <span className="font-normal normal-case text-gray-400">(optional)</span></label>
                    <input value={e.gpa || ""} onChange={(v) => updateEducation(e.id, { gpa: v.target.value })} placeholder="e.g. 3.8" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Start Date</label>
                    <MonthYearSelect value={e.startDate} onChange={(v) => updateEducation(e.id, { startDate: v })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">End Date</label>
                    <MonthYearSelect value={isCurrent ? "" : e.endDate} onChange={(v) => updateEducation(e.id, { endDate: v })} disabled={isCurrent} />
                    <label className="inline-flex items-center gap-2 mt-2 cursor-pointer select-none">
                      <input type="checkbox" checked={isCurrent} onChange={(ev) => updateEducation(e.id, { endDate: ev.target.checked ? "Present" : "" })} className="rounded border-slate-200 text-blue-600 focus:ring-blue-500" />
                      <span className="text-xs text-slate-600">Currently studying here</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Honors / Awards <span className="font-normal normal-case text-gray-400">(optional)</span></label>
                  <input value={e.honors || ""} onChange={(v) => updateEducation(e.id, { honors: v.target.value })} placeholder="e.g. Magna Cum Laude, Dean's List" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={addEducation} className="mt-3 w-full border-2 border-dashed border-slate-200 hover:border-blue-400 text-gray-500 hover:text-blue-600 rounded-xl py-3 text-sm font-medium transition-colors">
        + Add Education
      </button>

      <h3 className="text-sm font-semibold text-slate-700 mt-8 mb-3">Certifications</h3>
      <div className="space-y-3">
        {resumeData.certifications.map((c, idx) => (
          <div key={c.id} className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Certification {idx + 1}</span>
              <button onClick={() => removeCertification(c.id)} className="text-red-400 hover:text-red-600 text-xs font-medium">Remove</button>
            </div>
            <div className="p-4 space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Certification Name</label>
                  <input value={c.name} onChange={(v) => updateCertification(c.id, { name: v.target.value })} placeholder="e.g. AWS Solutions Architect" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Issuing Organization</label>
                  <input value={c.issuer} onChange={(v) => updateCertification(c.id, { issuer: v.target.value })} placeholder="e.g. Amazon" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              {/* Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Credential ID</label>
                  <input value={c.credentialId ?? ""} onChange={(v) => updateCertification(c.id, { credentialId: v.target.value })} placeholder="e.g. ABC-123456" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Issue Date</label>
                  <MonthYearSelect value={c.validFrom ?? c.date} onChange={(v) => updateCertification(c.id, { validFrom: v, date: v })} />
                </div>
              </div>
              {/* Row 3 â€” expiry */}
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${c.neverExpires ? "text-gray-300" : "text-gray-600"}`}>Expiry Date</label>
                  <MonthYearSelect value={c.neverExpires ? "" : (c.validTo ?? "")} onChange={(v) => updateCertification(c.id, { validTo: v })} disabled={!!c.neverExpires} futureOnly />
                </div>
                <div className="flex-shrink-0 pb-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div
                      onClick={() => updateCertification(c.id, { neverExpires: !c.neverExpires, validTo: !c.neverExpires ? "" : c.validTo })}
                      className={`relative w-9 h-5 rounded-full transition-colors ${ c.neverExpires ? "bg-blue-600" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${c.neverExpires ? "translate-x-4" : "translate-x-0"}`} />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Never Expires</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={addCertification} className="mt-3 w-full border-2 border-dashed border-slate-200 hover:border-blue-400 text-gray-500 hover:text-blue-600 rounded-xl py-3 text-sm font-medium transition-colors">
        + Add Certification
      </button>

      <div className="flex justify-between mt-8">
        <button onClick={prevStep} className="border border-slate-200 text-slate-600 px-5 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-colors">
          â† Back
        </button>
        <button onClick={nextStep} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
          Next: Skills â†’
        </button>
      </div>
    </div>
  );
}


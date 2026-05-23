"use client";

import { useResumeStore } from "@/store/resumeStore";
import { useState, useEffect } from "react";

export default function TargetRoleStep() {
  const { resumeData, setTargetRole, setJobDescription, nextStep, prevStep } =
    useResumeStore();
  const [role, setRole] = useState(resumeData.targetRole);
  const [jd, setJd] = useState(resumeData.jobDescription || "");

  // Sync local state whenever the store changes (e.g. after upload)
  useEffect(() => {
    setRole(resumeData.targetRole);
    setJd(resumeData.jobDescription || "");
  }, [resumeData.targetRole, resumeData.jobDescription]);
  const [error, setError] = useState("");

  function handleNext() {
    if (!role.trim()) {
      setError("Please enter your target role.");
      return;
    }
    setTargetRole(role);
    setJobDescription(jd);
    nextStep();
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-1">Target Role & Job Description</h2>
      <p className="text-sm text-slate-500 mb-6">
        Tell us the role you&apos;re applying for. Pasting a job description enables ATS
        optimization.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Target Role <span className="text-red-500">*</span>
          </label>
          <input
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setError("");
            }}
            placeholder="e.g. Senior Product Manager"
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? "border-red-400" : "border-gray-300"
            }`}
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Job Description{" "}
            <span className="text-gray-400 font-normal">(optional â€” enables ATS tailoring)</span>
          </label>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={8}
            placeholder="Paste the full job description here..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-slate-400 mt-1">
            {jd.length} characters â€” AI uses the first ~2,000 for optimization
          </p>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={prevStep}
          className="border border-slate-200 text-slate-600 px-5 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-colors"
        >
          â† Back
        </button>
        <button
          onClick={handleNext}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
        >
          Next: Experience â†’
        </button>
      </div>
    </div>
  );
}


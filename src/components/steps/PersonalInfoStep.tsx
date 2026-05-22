"use client";

import { useResumeStore } from "@/store/resumeStore";
import { useState, useEffect } from "react";

export default function PersonalInfoStep() {
  const { resumeData, setPersonalInfo, nextStep } = useResumeStore();
  const [form, setForm] = useState(resumeData.personalInfo);

  // Sync local form state whenever the store's personalInfo changes (e.g. after upload)
  useEffect(() => {
    setForm(resumeData.personalInfo);
  }, [resumeData.personalInfo]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email";
    if (!form.phone.trim()) e.phone = "Phone is required";
    if (!form.location.trim()) e.location = "Location is required";
    return e;
  }

  function handleNext() {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setPersonalInfo(form);
    nextStep();
  }

  const initials = form.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-1">Personal Details</h2>
      <p className="text-sm text-gray-500 mb-6">Start with your basic contact information.</p>

      {/* Avatar preview */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="w-14 h-14 rounded-full bg-violet-100 border-2 border-violet-200 flex items-center justify-center text-violet-600 font-bold text-lg flex-shrink-0">
          {initials || "?"}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{form.fullName || "Your Name"}</p>
          <p className="text-xs text-gray-400 mt-0.5">{form.jobTitle || "Job Title"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="e.g. Jane Smith"
            className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.fullName ? "border-red-400" : "border-gray-300"}`}
          />
          {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            Job Title
          </label>
          <input
            value={form.jobTitle || ""}
            onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
            placeholder="e.g. Senior Software Engineer"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="jane@example.com"
            className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.email ? "border-red-400" : "border-gray-300"}`}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+1 (555) 000-0000"
            className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.phone ? "border-red-400" : "border-gray-300"}`}
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            City / Location <span className="text-red-500">*</span>
          </label>
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. New York, NY"
            className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.location ? "border-red-400" : "border-gray-300"}`}
          />
          {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            LinkedIn
          </label>
          <input
            value={form.linkedin || ""}
            onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
            placeholder="linkedin.com/in/janesmith"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            Website / Portfolio
          </label>
          <input
            value={form.website || ""}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="e.g. janesmith.dev"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <button
          onClick={handleNext}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
        >
          Next: Experience →
        </button>
      </div>
    </div>
  );
}

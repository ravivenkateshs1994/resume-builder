"use client";

import HeadshotAvatar from "@/components/HeadshotAvatar";
import { useResumeStore } from "@/store/resumeStore";
import { useState, useEffect, useRef } from "react";

export default function PersonalInfoStep() {
  const { resumeData, setPersonalInfo, nextStep } = useResumeStore();
  const [form, setForm] = useState(resumeData.personalInfo);
  const headshotInputRef = useRef<HTMLInputElement>(null);

  // Sync local form state whenever the store's personalInfo changes (e.g. after upload)
  useEffect(() => {
    setForm(resumeData.personalInfo);
  }, [resumeData.personalInfo]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [headshotError, setHeadshotError] = useState("");

  function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to read image."));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read image."));
      reader.readAsDataURL(file);
    });
  }

  async function handleHeadshotUpload(file: File) {
    setHeadshotError("");

    if (!file.type.startsWith("image/")) {
      setHeadshotError("Please upload a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setHeadshotError("Please use an image smaller than 2 MB.");
      return;
    }

    try {
      const headshotUrl = await readFileAsDataUrl(file);
      const nextForm = { ...form, headshotUrl };
      setForm(nextForm);
      setPersonalInfo(nextForm);
    } catch {
      setHeadshotError("We could not read that image. Try another file.");
    } finally {
      if (headshotInputRef.current) {
        headshotInputRef.current.value = "";
      }
    }
  }

  function removeHeadshot() {
    const nextForm = { ...form, headshotUrl: undefined };
    setForm(nextForm);
    setPersonalInfo(nextForm);
    setHeadshotError("");
    if (headshotInputRef.current) {
      headshotInputRef.current.value = "";
    }
  }

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
      <h2 className="text-xl font-bold text-slate-800 mb-1">Personal Details</h2>
      <p className="text-sm text-slate-500 mb-6">Start with your basic contact information.</p>

      {/* Avatar preview */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <HeadshotAvatar
              headshotUrl={form.headshotUrl}
              initials={initials}
              alt={`${form.fullName || "Candidate"} headshot`}
              className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-violet-200 bg-violet-100"
              fallbackClassName="h-full w-full flex items-center justify-center text-violet-600 font-bold text-2xl"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{form.fullName || "Your Name"}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{form.jobTitle || "Job Title"}</p>
              <p className="text-[11px] text-slate-500 mt-2">Recommended: square image, 512 x 512 px or larger.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => headshotInputRef.current?.click()}
              className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-semibold text-violet-700 transition-colors hover:border-violet-300 hover:bg-violet-50"
            >
              {form.headshotUrl ? "Replace headshot" : "Add headshot"}
            </button>
            {form.headshotUrl && (
              <button
                type="button"
                onClick={removeHeadshot}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {headshotError && <p className="mt-3 text-xs text-red-500">{headshotError}</p>}
      </div>

      <input
        ref={headshotInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            void handleHeadshotUpload(file);
          }
          e.target.value = "";
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="e.g. Jane Smith"
            className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.fullName ? "border-red-400" : "border-slate-200"}`}
          />
          {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
            Job Title
          </label>
          <input
            value={form.jobTitle || ""}
            onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
            placeholder="e.g. Senior Software Engineer"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="jane@example.com"
            className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.email ? "border-red-400" : "border-slate-200"}`}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+1 (555) 000-0000"
            className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.phone ? "border-red-400" : "border-slate-200"}`}
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
            City / Location <span className="text-red-500">*</span>
          </label>
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. New York, NY"
            className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.location ? "border-red-400" : "border-slate-200"}`}
          />
          {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
            LinkedIn
          </label>
          <input
            value={form.linkedin || ""}
            onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
            placeholder="linkedin.com/in/janesmith"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
            Website / Portfolio
          </label>
          <input
            value={form.website || ""}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="e.g. janesmith.dev"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
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

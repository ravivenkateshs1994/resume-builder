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
      <h2 className="mb-1 text-[22px] font-bold text-slate-800 md:text-[30px]">Personal Details</h2>
      <p className="mb-6 break-words text-sm text-slate-500 md:text-base">Start with your basic contact information.</p>

      {/* Avatar preview */}
      <div className="mb-6 max-w-full overflow-x-hidden rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <HeadshotAvatar
              headshotUrl={form.headshotUrl}
              alt={`${form.fullName || "Candidate"} headshot`}
              className="h-32 w-32 shrink-0 overflow-hidden rounded-3xl border-2 border-blue-200 bg-blue-100"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-800 md:text-base">{form.fullName || "Your Name"}</p>
              <p className="mt-0.5 truncate text-xs text-gray-400 md:text-sm">{form.jobTitle || "Job Title"}</p>
              <p className="mt-2 break-words text-[11px] text-slate-500 md:text-xs">Recommended: square image, 512 x 512 px or larger.</p>
            </div>
          </div>

          <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:flex-row md:flex-wrap md:items-center">
            <button
              type="button"
              onClick={() => headshotInputRef.current?.click()}
              className="min-h-[44px] w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-50 md:w-auto"
            >
              {form.headshotUrl ? "Replace headshot" : "Add headshot"}
            </button>
            {form.headshotUrl && (
              <button
                type="button"
                onClick={removeHeadshot}
                className="min-h-[44px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700 md:w-auto"
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

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-600">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="e.g. Jane Smith"
            className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.fullName ? "border-red-400" : "border-slate-200"}`}
          />
          {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
        </div>

        <div>
          <label className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-600">
            Job Title
          </label>
          <input
            value={form.jobTitle || ""}
            onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
            placeholder="e.g. Senior Software Engineer"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-600">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="jane@example.com"
            className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? "border-red-400" : "border-slate-200"}`}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-600">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+1 (555) 000-0000"
            className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? "border-red-400" : "border-slate-200"}`}
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-600">
            City / Location <span className="text-red-500">*</span>
          </label>
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. New York, NY"
            className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.location ? "border-red-400" : "border-slate-200"}`}
          />
          {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
        </div>

        <div>
          <label className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-600">
            LinkedIn
          </label>
          <input
            value={form.linkedin || ""}
            onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
            placeholder="linkedin.com/in/janesmith"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-600">
            Website / Portfolio
          </label>
          <input
            value={form.website || ""}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="e.g. janesmith.dev"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleNext}
          className="min-h-[44px] w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 font-medium text-white transition-colors hover:from-blue-700 hover:to-indigo-700 md:w-auto"
        >
          Next: Experience
        </button>
      </div>
    </div>
  );
}


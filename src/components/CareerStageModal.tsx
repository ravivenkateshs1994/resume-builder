"use client";

import React, { useState } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { setCareerStage as setCareerStageRemote } from "@/lib/careerStage";
import { useResumeStore } from "@/store/resumeStore";
import type { CareerStage } from "@/types/careerStage";

export default function CareerStageModal({ onComplete }: { onComplete?: (stage: CareerStage) => void }) {
  const { supabase, isLoggedIn } = useSupabaseAuth();
  const setCareerStageLocal = useResumeStore((s) => s.setCareerStage);
  const [selection, setSelection] = useState<CareerStage | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!selection) return;
    setSaving(true);
    try {
      if (isLoggedIn && supabase) {
        await setCareerStageRemote(supabase, selection);
      }
      setCareerStageLocal(selection);
      onComplete?.(selection);
    } catch {
      // ignore — best-effort
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-semibold">Tell us about your experience</h3>
        <p className="mt-2 text-sm text-slate-600">This helps us personalize your dashboard and recommendations.</p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setSelection("FRESHER")}
            className={`rounded-lg border p-4 text-left ${selection === "FRESHER" ? "border-indigo-500 bg-indigo-50" : "border-slate-200"}`}
          >
            <p className="font-semibold">Fresher / Student</p>
            <p className="mt-1 text-sm text-slate-600">I&apos;m starting my career and want entry-level guidance.</p>
          </button>

          <button
            type="button"
            onClick={() => setSelection("EXPERIENCED")}
            className={`rounded-lg border p-4 text-left ${selection === "EXPERIENCED" ? "border-teal-500 bg-teal-50" : "border-slate-200"}`}
          >
            <p className="font-semibold">Experienced Professional</p>
            <p className="mt-1 text-sm text-slate-600">I have work experience and want growth and senior role guidance.</p>
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={!selection || saving}
            className="crp-btn-primary px-4 py-2"
          >
            {saving ? "Saving…" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

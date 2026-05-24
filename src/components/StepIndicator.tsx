"use client";

import { useResumeStore } from "@/store/resumeStore";
import type { FormStep } from "@/types/resume";

const STEPS: { id: FormStep; label: string }[] = [
  { id: "personal", label: "Personal Info" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills" },
  { id: "preview", label: "Preview" },
];

export default function StepIndicator({ variant = "horizontal" }: { variant?: "horizontal" | "vertical" }) {
  const currentStep = useResumeStore((s) => s.currentStep);
  const goToStep = useResumeStore((s) => s.goToStep);
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  if (variant === "vertical") {
    return (
      <nav className="flex flex-col gap-1">
        {STEPS.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <div key={step.id} className="flex flex-col">
              <button
                type="button"
                onClick={() => goToStep(step.id)}
                aria-current={active ? "step" : undefined}
                aria-label={`Go to step ${i + 1}: ${step.label}`}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : done
                    ? "text-slate-600 hover:bg-slate-50"
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    done
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : active
                      ? "border-indigo-600 text-indigo-600 bg-white"
                      : "border-slate-300 text-slate-400"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </div>
                <span className="text-xs font-semibold leading-tight">{step.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`ml-[22px] w-0.5 h-4 ${
                  i < currentIndex ? "bg-indigo-300" : "bg-slate-200"
                }`} />
              )}
            </div>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="mb-6 w-full max-w-full overflow-x-hidden md:mb-8">
      <div className="relative grid grid-cols-5 gap-2">
        {/* Progress line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute top-4 left-0 h-0.5 bg-indigo-600 z-0 transition-all duration-500"
          style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => goToStep(step.id)}
              className="group z-10 flex min-w-0 flex-col items-center"
              aria-current={active ? "step" : undefined}
              aria-label={`Go to step ${i + 1}: ${step.label}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300 ${
                  done
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : active
                    ? "bg-white border-indigo-600 text-indigo-600"
                    : "bg-white border-slate-300 text-slate-400 group-hover:border-indigo-400 group-hover:text-indigo-500"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className={`mt-1 break-words text-center text-[10px] font-medium leading-tight sm:text-xs ${
                  active
                    ? "text-indigo-600"
                    : done
                    ? "text-slate-600"
                    : "text-slate-400 group-hover:text-indigo-500"
                }`}
              >
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

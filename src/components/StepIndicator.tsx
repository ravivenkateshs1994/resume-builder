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
                    ? "bg-blue-50 text-blue-700"
                    : done
                    ? "text-gray-600 hover:bg-gray-50"
                    : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    done
                      ? "bg-blue-600 border-blue-600 text-white"
                      : active
                      ? "border-blue-600 text-blue-600 bg-white"
                      : "border-gray-300 text-gray-400"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </div>
                <span className="text-xs font-semibold leading-tight">{step.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`ml-[22px] w-0.5 h-4 ${
                  i < currentIndex ? "bg-blue-300" : "bg-gray-200"
                }`} />
              )}
            </div>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute top-4 left-0 h-0.5 bg-blue-600 z-0 transition-all duration-500"
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
              className="flex flex-col items-center z-10 group"
              aria-current={active ? "step" : undefined}
              aria-label={`Go to step ${i + 1}: ${step.label}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300 ${
                  done
                    ? "bg-blue-600 border-blue-600 text-white"
                    : active
                    ? "bg-white border-blue-600 text-blue-600"
                    : "bg-white border-gray-300 text-gray-400 group-hover:border-blue-400 group-hover:text-blue-500"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className={`mt-1 text-xs font-medium hidden sm:block ${
                  active
                    ? "text-blue-600"
                    : done
                    ? "text-gray-600"
                    : "text-gray-400 group-hover:text-blue-500"
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

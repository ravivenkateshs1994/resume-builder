import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ResumeData,
  FormStep,
  TemplateId,
  WorkExperience,
  Education,
  Certification,
} from "@/types/resume";
import { getDefaultTemplateAccent } from "@/lib/templateTheme";

// ─── helpers ──────────────────────────────────────────────────────────────────
const newId = () => Math.random().toString(36).slice(2, 10);

const defaultResume: ResumeData = {
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    website: "",
    jobTitle: "",
  },
  targetRole: "",
  jobDescription: "",
  summary: "",
  workExperience: [],
  education: [],
  skills: [],
  certifications: [],
};

const STEPS: FormStep[] = [
  "personal",
  "experience",
  "education",
  "skills",
  "preview",
];

// ─── Store ────────────────────────────────────────────────────────────────────

interface ResumeStore {
  currentStep: FormStep;
  resumeData: ResumeData;
  selectedTemplate: TemplateId;
  templateAccentColor: string;
  isGenerating: boolean;
  uploadedResume: { label: string; resumeData: ResumeData } | null;

  // Navigation
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: FormStep) => void;

  // Data setters
  setUploadedResume: (val: { label: string; resumeData: ResumeData } | null) => void;
  setPersonalInfo: (info: ResumeData["personalInfo"]) => void;
  setTargetRole: (role: string) => void;
  setJobDescription: (jd: string) => void;
  setSummary: (summary: string) => void;
  setSkills: (skills: string[]) => void;
  setSelectedTemplate: (id: TemplateId) => void;
  setTemplateAccentColor: (color: string) => void;
  setResumeData: (data: Partial<ResumeData>) => void;
  setIsGenerating: (v: boolean) => void;

  // Work Experience
  addWorkExperience: () => void;
  updateWorkExperience: (id: string, data: Partial<WorkExperience>) => void;
  removeWorkExperience: (id: string) => void;

  // Education
  addEducation: () => void;
  updateEducation: (id: string, data: Partial<Education>) => void;
  removeEducation: (id: string) => void;

  // Certifications
  addCertification: () => void;
  updateCertification: (id: string, data: Partial<Certification>) => void;
  removeCertification: (id: string) => void;

  // Reset
  reset: () => void;
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
  currentStep: "personal",
  resumeData: defaultResume,
  selectedTemplate: "modern",
  templateAccentColor: getDefaultTemplateAccent("modern"),
  isGenerating: false,
  uploadedResume: null,

  nextStep: () => {
    const idx = STEPS.indexOf(get().currentStep);
    if (idx < STEPS.length - 1) set({ currentStep: STEPS[idx + 1] });
  },

  prevStep: () => {
    const idx = STEPS.indexOf(get().currentStep);
    if (idx > 0) set({ currentStep: STEPS[idx - 1] });
  },

  goToStep: (step) => set({ currentStep: step }),

  setUploadedResume: (val) => set({ uploadedResume: val }),

  setPersonalInfo: (info) =>
    set((s) => ({ resumeData: { ...s.resumeData, personalInfo: info } })),

  setTargetRole: (role) =>
    set((s) => ({ resumeData: { ...s.resumeData, targetRole: role } })),

  setJobDescription: (jd) =>
    set((s) => ({ resumeData: { ...s.resumeData, jobDescription: jd } })),

  setSummary: (summary) =>
    set((s) => ({ resumeData: { ...s.resumeData, summary } })),

  setSkills: (skills) =>
    set((s) => ({ resumeData: { ...s.resumeData, skills } })),

  setSelectedTemplate: (id) =>
    set({ selectedTemplate: id, templateAccentColor: getDefaultTemplateAccent(id) }),

  setTemplateAccentColor: (color) => set({ templateAccentColor: color }),

  setResumeData: (data) =>
    set((s) => ({ resumeData: { ...s.resumeData, ...data } })),

  setIsGenerating: (v) => set({ isGenerating: v }),

  // Work Experience
  addWorkExperience: () =>
    set((s) => ({
      resumeData: {
        ...s.resumeData,
        workExperience: [
          ...s.resumeData.workExperience,
          {
            id: newId(),
            company: "",
            title: "",
            location: "",
            startDate: "",
            endDate: "Present",
            description: "",
          },
        ],
      },
    })),

  updateWorkExperience: (id, data) =>
    set((s) => ({
      resumeData: {
        ...s.resumeData,
        workExperience: s.resumeData.workExperience.map((w) =>
          w.id === id ? { ...w, ...data } : w
        ),
      },
    })),

  removeWorkExperience: (id) =>
    set((s) => ({
      resumeData: {
        ...s.resumeData,
        workExperience: s.resumeData.workExperience.filter((w) => w.id !== id),
      },
    })),

  // Education
  addEducation: () =>
    set((s) => ({
      resumeData: {
        ...s.resumeData,
        education: [
          ...s.resumeData.education,
          {
            id: newId(),
            institution: "",
            degree: "",
            field: "",
            startDate: "",
            endDate: "",
            gpa: "",
            honors: "",
          },
        ],
      },
    })),

  updateEducation: (id, data) =>
    set((s) => ({
      resumeData: {
        ...s.resumeData,
        education: s.resumeData.education.map((e) =>
          e.id === id ? { ...e, ...data } : e
        ),
      },
    })),

  removeEducation: (id) =>
    set((s) => ({
      resumeData: {
        ...s.resumeData,
        education: s.resumeData.education.filter((e) => e.id !== id),
      },
    })),

  // Certifications
  addCertification: () =>
    set((s) => ({
      resumeData: {
        ...s.resumeData,
        certifications: [
          ...s.resumeData.certifications,
          { id: newId(), name: "", issuer: "", date: "" },
        ],
      },
    })),

  updateCertification: (id, data) =>
    set((s) => ({
      resumeData: {
        ...s.resumeData,
        certifications: s.resumeData.certifications.map((c) =>
          c.id === id ? { ...c, ...data } : c
        ),
      },
    })),

  removeCertification: (id) =>
    set((s) => ({
      resumeData: {
        ...s.resumeData,
        certifications: s.resumeData.certifications.filter((c) => c.id !== id),
      },
    })),

  reset: () =>
    set({
      currentStep: "personal",
      resumeData: defaultResume,
      selectedTemplate: "modern",
      templateAccentColor: getDefaultTemplateAccent("modern"),
      isGenerating: false,
    }),
  }),
  {
    name: "resume-store",
    // Persist with a 24-hour TTL: stored payload includes __savedAt timestamp
    getStorage: () => ({
      getItem: (name: string) => {
        try {
          const raw = localStorage.getItem(name);
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          // If the stored payload contains a __savedAt timestamp, enforce TTL
          const TTL = 1000 * 60 * 60 * 24; // 24 hours
          if (parsed && typeof parsed === "object" && parsed.__savedAt) {
            const savedAt = Number(parsed.__savedAt) || 0;
            if (Date.now() - savedAt > TTL) {
              localStorage.removeItem(name);
              return null;
            }
            // Return the serialized state part for zustand to parse
            return JSON.stringify(parsed.state ?? parsed);
          }
          // Backwards compatibility: return raw for older plain-state entries
          return raw;
        } catch (e) {
          return null;
        }
      },
      setItem: (name: string, value: string) => {
        try {
          const state = JSON.parse(value);
          const payload = { state, __savedAt: Date.now() };
          localStorage.setItem(name, JSON.stringify(payload));
        } catch (e) {
          // fallback: write raw value
          localStorage.setItem(name, value);
        }
      },
      removeItem: (name: string) => localStorage.removeItem(name),
    }),
  }
));

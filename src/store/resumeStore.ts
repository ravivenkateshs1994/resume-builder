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

const STEPS: FormStep[] = ["personal", "experience", "education", "skills", "preview"];

interface ResumeStore {
  currentStep: FormStep;
  resumeData: ResumeData;
  selectedTemplate: TemplateId;
  templateAccentColor: string;
  isGenerating: boolean;
  uploadedResume: { label: string; resumeData: ResumeData } | null;

  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: FormStep) => void;

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

  addWorkExperience: () => void;
  updateWorkExperience: (id: string, data: Partial<WorkExperience>) => void;
  removeWorkExperience: (id: string) => void;

  addEducation: () => void;
  updateEducation: (id: string, data: Partial<Education>) => void;
  removeEducation: (id: string) => void;

  addCertification: () => void;
  updateCertification: (id: string, data: Partial<Certification>) => void;
  removeCertification: (id: string) => void;

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

      setPersonalInfo: (info) => set((s) => ({ resumeData: { ...s.resumeData, personalInfo: info } })),

      setTargetRole: (role) => set((s) => ({ resumeData: { ...s.resumeData, targetRole: role } })),

      setJobDescription: (jd) => set((s) => ({ resumeData: { ...s.resumeData, jobDescription: jd } })),

      setSummary: (summary) => set((s) => ({ resumeData: { ...s.resumeData, summary } })),

      setSkills: (skills) => set((s) => ({ resumeData: { ...s.resumeData, skills } })),

      setSelectedTemplate: (id) => set({ selectedTemplate: id, templateAccentColor: getDefaultTemplateAccent(id) }),

      setTemplateAccentColor: (color) => set({ templateAccentColor: color }),

      setResumeData: (data) => set((s) => ({ resumeData: { ...s.resumeData, ...data } })),

      setIsGenerating: (v) => set({ isGenerating: v }),

      addWorkExperience: () =>
        set((s) => ({
          resumeData: {
            ...s.resumeData,
            workExperience: [
              ...s.resumeData.workExperience,
              { id: newId(), company: "", title: "", location: "", startDate: "", endDate: "Present", description: "" },
            ],
          },
        })),

      updateWorkExperience: (id, data) =>
        set((s) => ({
          resumeData: {
            ...s.resumeData,
            workExperience: s.resumeData.workExperience.map((w) => (w.id === id ? { ...w, ...data } : w)),
          },
        })),

      removeWorkExperience: (id) =>
        set((s) => ({ resumeData: { ...s.resumeData, workExperience: s.resumeData.workExperience.filter((w) => w.id !== id) } })),

      addEducation: () =>
        set((s) => ({
          resumeData: {
            ...s.resumeData,
            education: [
              ...s.resumeData.education,
              { id: newId(), institution: "", degree: "", field: "", startDate: "", endDate: "", gpa: "", honors: "" },
            ],
          },
        })),

      updateEducation: (id, data) =>
        set((s) => ({
          resumeData: { ...s.resumeData, education: s.resumeData.education.map((e) => (e.id === id ? { ...e, ...data } : e)) },
        })),

      removeEducation: (id) => set((s) => ({ resumeData: { ...s.resumeData, education: s.resumeData.education.filter((e) => e.id !== id) } })),

      addCertification: () =>
        set((s) => ({
          resumeData: { ...s.resumeData, certifications: [...s.resumeData.certifications, { id: newId(), name: "", issuer: "", date: "" }] },
        })),

      updateCertification: (id, data) =>
        set((s) => ({ resumeData: { ...s.resumeData, certifications: s.resumeData.certifications.map((c) => (c.id === id ? { ...c, ...data } : c)) } })),

      removeCertification: (id) => set((s) => ({ resumeData: { ...s.resumeData, certifications: s.resumeData.certifications.filter((c) => c.id !== id) } })),

      reset: () => set({ currentStep: "personal", resumeData: defaultResume, selectedTemplate: "modern", templateAccentColor: getDefaultTemplateAccent("modern"), isGenerating: false }),
    }),
    { name: "resume-store" } as any
  )
);

export default useResumeStore;

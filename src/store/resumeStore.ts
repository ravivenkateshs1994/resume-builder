import { create } from "zustand";
import type {
  ResumeData,
  FormStep,
  TemplateId,
  WorkExperience,
  Education,
  Certification,
} from "@/types/resume";
import type { CareerStage } from "@/types/careerStage";
import { DEFAULT_CAREER_STAGE } from "@/types/careerStage";
import { getDefaultTemplateAccent } from "@/lib/templateTheme";
import { getTemplateById } from "@/lib/templateCatalog";

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
  resumeHistory: { id: string; createdAt: string; title: string; resumeSnapshot: ResumeData }[];

  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: FormStep) => void;

  setUploadedResume: (val: { label: string; resumeData: ResumeData } | null) => void;
  setPersonalInfo: (info: ResumeData["personalInfo"]) => void;
  setSummary: (summary: string) => void;
  setSkills: (skills: string[]) => void;
  setSelectedTemplate: (id: TemplateId) => void;
  setTemplateAccentColor: (color: string) => void;
  setResumeData: (data: Partial<ResumeData>) => void;
  setIsGenerating: (v: boolean) => void;

  addResumeRecord: (payload: { title: string; resumeSnapshot: ResumeData }) => void;
  removeResumeRecord: (id: string) => void;
  clearResumeHistory: () => void;

  // Cloud sync helpers
  syncLocalResumesToCloud: (token: string) => Promise<void>;
  // (moved) transient analysis payload is now managed in a dedicated analysis store

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
  careerStage: CareerStage;
  setCareerStage: (stage: CareerStage) => void;
}

export const useResumeStore = create<ResumeStore>()((set, get) => ({
      currentStep: "personal",
      resumeData: defaultResume,
      selectedTemplate: "modern",
      templateAccentColor: getDefaultTemplateAccent("modern"),
      isGenerating: false,
      uploadedResume: null,
      resumeHistory: [],
      careerStage: DEFAULT_CAREER_STAGE,

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

      /* targetRole / jobDescription are analysis-specific inputs and are managed
        via the analysis store now; avoid exposing dedicated setters here. */

      setSummary: (summary) => set((s) => ({ resumeData: { ...s.resumeData, summary } })),

      setSkills: (skills) => set((s) => ({ resumeData: { ...s.resumeData, skills } })),

      setSelectedTemplate: (id) => set({ selectedTemplate: id, templateAccentColor: getDefaultTemplateAccent(id) }),

      setTemplateAccentColor: (color) => set({ templateAccentColor: color }),

      setResumeData: (data) => set((s) => ({ resumeData: { ...s.resumeData, ...data } })),

      setIsGenerating: (v) => set({ isGenerating: v }),

  setCareerStage: (stage: CareerStage) => set({ careerStage: stage }),

      addResumeRecord: ({ title, resumeSnapshot }) =>
        set((s) => {
          const record = {
            id: `resume-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            createdAt: new Date().toISOString(),
            title: title.trim() || "Resume Draft",
            resumeSnapshot: JSON.parse(JSON.stringify(resumeSnapshot)) as ResumeData,
          };
          return { resumeHistory: [record, ...s.resumeHistory].slice(0, 50) };
        }),

      removeResumeRecord: (id) => set((s) => ({ resumeHistory: s.resumeHistory.filter((r) => r.id !== id) })),

      clearResumeHistory: () => set({ resumeHistory: [] }),

      syncLocalResumesToCloud: async (token: string) => {
        if (!token) return;
        const state = get();
        const locals = [...state.resumeHistory];
        for (const rec of locals) {
          try {
            // Ensure template metadata is present in the snapshot saved to cloud
            const snapshot: any = rec.resumeSnapshot ?? {};
            const templateMeta = snapshot.template ?? {
              id: state.selectedTemplate,
              name: getTemplateById(state.selectedTemplate)?.name || state.selectedTemplate,
              accentColor: state.templateAccentColor,
            };
            const resumeToUpload = { ...snapshot, template: templateMeta };

            const res = await fetch("/api/cloud/resumes", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ title: rec.title, resumeData: resumeToUpload }),
            });
            if (res.ok) {
              set((s) => ({ resumeHistory: s.resumeHistory.filter((r) => r.id !== rec.id) }));
            }
          } catch {
            // ignore and continue
          }
        }
      },

      // pendingAnalysis moved to analysisStore

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

      removeWorkExperience: (id) => set((s) => ({ resumeData: { ...s.resumeData, workExperience: s.resumeData.workExperience.filter((w) => w.id !== id) } })),

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
        set((s) => ({ resumeData: { ...s.resumeData, education: s.resumeData.education.map((e) => (e.id === id ? { ...e, ...data } : e)) } })),

      removeEducation: (id) => set((s) => ({ resumeData: { ...s.resumeData, education: s.resumeData.education.filter((e) => e.id !== id) } })),

      addCertification: () =>
        set((s) => ({ resumeData: { ...s.resumeData, certifications: [...s.resumeData.certifications, { id: newId(), name: "", issuer: "", date: "" }] },
        })),

      updateCertification: (id, data) =>
        set((s) => ({ resumeData: { ...s.resumeData, certifications: s.resumeData.certifications.map((c) => (c.id === id ? { ...c, ...data } : c)) } })),

      removeCertification: (id) => set((s) => ({ resumeData: { ...s.resumeData, certifications: s.resumeData.certifications.filter((c) => c.id !== id) } })),

      reset: () => set({ currentStep: "personal", resumeData: defaultResume, selectedTemplate: "modern", templateAccentColor: getDefaultTemplateAccent("modern"), isGenerating: false }),
    })
);

export default useResumeStore;

import { create } from "zustand";
import type { SavedAnalysisRecord, PendingAnalysis } from "@/types/analysis";

interface AnalysisStore {
  savedAnalyses: SavedAnalysisRecord[];
  setSavedAnalyses: (arr: SavedAnalysisRecord[]) => void;
  addSavedAnalysis: (rec: SavedAnalysisRecord) => void;
  removeSavedAnalysis: (id: string) => void;

  pendingAnalysis: PendingAnalysis;
  setPendingAnalysis: (val: PendingAnalysis) => void;
}

export const useAnalysisStore = create<AnalysisStore>()((set) => ({
  savedAnalyses: [],
  setSavedAnalyses: (arr) => set({ savedAnalyses: arr }),
  addSavedAnalysis: (rec) => set((s) => ({ savedAnalyses: [rec, ...s.savedAnalyses] })),
  removeSavedAnalysis: (id) => set((s) => ({ savedAnalyses: s.savedAnalyses.filter((r) => r.id !== id) })),

  pendingAnalysis: null,
  setPendingAnalysis: (val) => set({ pendingAnalysis: val }),
}));

export default useAnalysisStore;

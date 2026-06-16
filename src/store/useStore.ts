import { create } from 'zustand';
import type {
  RiskAnnotation,
  ReviewNote,
  MedicationRecord,
  VisitRecord,
  ActivityRecord,
} from '@/types';

interface AppState {
  selectedDateRange: [string, string];
  setSelectedDateRange: (range: [string, string]) => void;

  annotations: RiskAnnotation[];
  setAnnotations: (annotations: RiskAnnotation[]) => void;

  reviewNotes: ReviewNote[];
  addReviewNote: (note: ReviewNote) => void;
  setReviewNotes: (notes: ReviewNote[]) => void;

  selectedAnnotation: RiskAnnotation | null;
  setSelectedAnnotation: (annotation: RiskAnnotation | null) => void;

  refreshKey: number;
  triggerRefresh: () => void;

  medicationRecords: MedicationRecord[];
  setMedicationRecords: (records: MedicationRecord[]) => void;

  visitRecords: VisitRecord[];
  setVisitRecords: (records: VisitRecord[]) => void;

  activityRecords: ActivityRecord[];
  setActivityRecords: (records: ActivityRecord[]) => void;

  exportModalOpen: boolean;
  setExportModalOpen: (open: boolean) => void;
}

const today = new Date().toISOString().slice(0, 10);
const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

export const useStore = create<AppState>((set) => ({
  selectedDateRange: [weekAgo, today],
  setSelectedDateRange: (range) => set({ selectedDateRange: range }),

  annotations: [],
  setAnnotations: (annotations) => set({ annotations }),

  reviewNotes: [],
  addReviewNote: (note) =>
    set((state) => ({ reviewNotes: [...state.reviewNotes, note] })),
  setReviewNotes: (notes) => set({ reviewNotes: notes }),

  selectedAnnotation: null,
  setSelectedAnnotation: (annotation) => set({ selectedAnnotation: annotation }),

  refreshKey: 0,
  triggerRefresh: () => set((state) => ({ refreshKey: state.refreshKey + 1 })),

  medicationRecords: [],
  setMedicationRecords: (records) => set({ medicationRecords: records }),

  visitRecords: [],
  setVisitRecords: (records) => set({ visitRecords: records }),

  activityRecords: [],
  setActivityRecords: (records) => set({ activityRecords: records }),

  exportModalOpen: false,
  setExportModalOpen: (open) => set({ exportModalOpen: open }),
}));

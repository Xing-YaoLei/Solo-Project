import { create } from 'zustand';
import dayjs, { Dayjs } from 'dayjs';
import { Hearing, ConflictCheck, ExceptionRecord } from '@/types';
import { hearingApi } from '@/lib/api';

interface AppState {
  currentDate: Dayjs;
  setCurrentDate: (date: Dayjs) => void;

  hearings: Hearing[];
  loading: boolean;
  fetchHearings: (range: { start: Dayjs; end: Dayjs }) => Promise<void>;

  selectedHearing: Hearing | null;
  setSelectedHearing: (h: Hearing | null) => void;

  conflicts: ConflictCheck[];
  fetchConflicts: () => Promise<void>;

  exceptions: ExceptionRecord[];
  fetchExceptions: () => Promise<void>;

  selectedMenuKey: string;
  setSelectedMenuKey: (k: string) => void;

  isHearingModalVisible: boolean;
  setHearingModalVisible: (v: boolean) => void;
  editingHearing: Hearing | null;
  setEditingHearing: (h: Hearing | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentDate: dayjs(),
  setCurrentDate: (date) => set({ currentDate: date }),

  hearings: [],
  loading: false,
  fetchHearings: async (range) => {
    set({ loading: true });
    try {
      const res = await hearingApi.calendar({
        startTimeFrom: range.start.startOf('day').toISOString(),
        startTimeTo: range.end.endOf('day').toISOString(),
      });
      set({ hearings: res.data || [] });
    } finally {
      set({ loading: false });
    }
  },

  selectedHearing: null,
  setSelectedHearing: (h) => set({ selectedHearing: h }),

  conflicts: [],
  fetchConflicts: async () => {},

  exceptions: [],
  fetchExceptions: async () => {},

  selectedMenuKey: 'dispatch',
  setSelectedMenuKey: (k) => set({ selectedMenuKey: k }),

  isHearingModalVisible: false,
  setHearingModalVisible: (v) => set({ isHearingModalVisible: v }),
  editingHearing: null,
  setEditingHearing: (h) => set({ editingHearing: h }),
}));

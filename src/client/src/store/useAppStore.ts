import { create } from 'zustand';
import type { ScheduleDetailDto, ExceptionRecordDetailDto } from '@/types';

interface AppState {
  currentSchedule: ScheduleDetailDto | null;
  currentException: ExceptionRecordDetailDto | null;
  refreshTrigger: number;
  setCurrentSchedule: (schedule: ScheduleDetailDto | null) => void;
  setCurrentException: (exception: ExceptionRecordDetailDto | null) => void;
  triggerRefresh: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentSchedule: null,
  currentException: null,
  refreshTrigger: 0,
  setCurrentSchedule: (schedule) => set({ currentSchedule: schedule }),
  setCurrentException: (exception) => set({ currentException: exception }),
  triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
}));

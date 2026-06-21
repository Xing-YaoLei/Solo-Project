'use client';

import { create } from 'zustand';
import type { FilterParams, AttendanceStatus, ReminderStatus } from '@/types';

interface FilterState {
  filters: FilterParams;
  setDateRange: (range: { start: Date; end: Date } | undefined) => void;
  setCaseTypes: (types: string[] | undefined) => void;
  setAttendanceStatuses: (statuses: AttendanceStatus[] | undefined) => void;
  setHasConflicts: (has: boolean | undefined) => void;
  setTimeSlots: (slots: string[] | undefined) => void;
  setReminderStatuses: (statuses: ReminderStatus[] | undefined) => void;
  clearFilters: () => void;
  setFilters: (filters: FilterParams) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  filters: {},
  setDateRange: (dateRange) =>
    set((state) => ({ filters: { ...state.filters, dateRange } })),
  setCaseTypes: (caseTypes) =>
    set((state) => ({ filters: { ...state.filters, caseTypes } })),
  setAttendanceStatuses: (attendanceStatuses) =>
    set((state) => ({ filters: { ...state.filters, attendanceStatuses } })),
  setHasConflicts: (hasConflicts) =>
    set((state) => ({ filters: { ...state.filters, hasConflicts } })),
  setTimeSlots: (timeSlots) =>
    set((state) => ({ filters: { ...state.filters, timeSlots } })),
  setReminderStatuses: (reminderStatuses) =>
    set((state) => ({ filters: { ...state.filters, reminderStatuses } })),
  clearFilters: () => set({ filters: {} }),
  setFilters: (filters) => set({ filters }),
}));

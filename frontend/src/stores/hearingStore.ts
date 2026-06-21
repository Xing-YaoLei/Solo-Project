import { create } from 'zustand';
import type { HearingSchedule, PagedResult } from '../types';
import { HearingStatus } from '../types';
import { hearingService } from '../services/hearingService';

interface HearingState {
  hearings: PagedResult<HearingSchedule> | null;
  currentHearing: HearingSchedule | null;
  loading: boolean;
  fetchHearings: (page: number, pageSize: number, filters?: { status?: HearingStatus; fromDate?: string; toDate?: string; courtRoom?: string; conflictFlagged?: boolean }) => Promise<void>;
  fetchHearing: (id: string) => Promise<void>;
  createHearing: (data: any) => Promise<HearingSchedule>;
  updateHearing: (id: string, data: any) => Promise<HearingSchedule>;
  changeStatus: (id: string, status: HearingStatus, reason?: string) => Promise<void>;
  batchChangeStatus: (ids: string[], status: HearingStatus, reason?: string) => Promise<void>;
  deleteHearing: (id: string) => Promise<void>;
}

export const useHearingStore = create<HearingState>((set) => ({
  hearings: null,
  currentHearing: null,
  loading: false,
  fetchHearings: async (page, pageSize, filters) => {
    set({ loading: true });
    try {
      const result = await hearingService.getList({ page, pageSize, ...filters });
      set({ hearings: result });
    } finally { set({ loading: false }); }
  },
  fetchHearing: async (id) => {
    set({ loading: true });
    try {
      const hearing = await hearingService.getById(id);
      set({ currentHearing: hearing });
    } finally { set({ loading: false }); }
  },
  createHearing: async (data) => {
    const hearing = await hearingService.create(data);
    return hearing;
  },
  updateHearing: async (id, data) => {
    const hearing = await hearingService.update(id, data);
    set({ currentHearing: hearing });
    return hearing;
  },
  changeStatus: async (id, status, reason) => {
    await hearingService.changeStatus(id, status, reason);
  },
  batchChangeStatus: async (ids, status, reason) => {
    await hearingService.batchChangeStatus(ids, status, reason);
  },
  deleteHearing: async (id) => {
    await hearingService.delete(id);
  },
}));

'use client';

import { create } from 'zustand';
import type { Complaint, ComplaintStatus, Priority } from '@scenic/shared';

interface QuickFilter {
  key: string;
  label: string;
}

interface ComplaintState {
  selectedComplaintId: string | null;
  selectedComplaint: Complaint | null;
  filters: {
    status: ComplaintStatus | ComplaintStatus[] | null;
    priority: Priority | Priority[] | null;
    ownerId: string | null;
    departmentId: string | null;
    tagId: string | null;
    keyword: string | null;
    dateFrom: string | null;
    dateTo: string | null;
    sortBy: 'createdAt' | 'deadlineAt' | 'priority';
    sortOrder: 'asc' | 'desc';
  };
  quickFilters: QuickFilter[];
  activeQuickFilter: string | null;
  setSelectedComplaint: (complaint: Complaint | null) => void;
  setSelectedComplaintId: (id: string | null) => void;
  setFilters: (filters: Partial<ComplaintState['filters']>) => void;
  resetFilters: () => void;
  setActiveQuickFilter: (key: string | null) => void;
}

const defaultFilters: ComplaintState['filters'] = {
  status: null,
  priority: null,
  ownerId: null,
  departmentId: null,
  tagId: null,
  keyword: null,
  dateFrom: null,
  dateTo: null,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const useComplaintStore = create<ComplaintState>((set) => ({
  selectedComplaintId: null,
  selectedComplaint: null,
  filters: { ...defaultFilters },
  quickFilters: [
    { key: 'all', label: '全部工单' },
    { key: 'pending', label: '待分派' },
    { key: 'processing', label: '处理中' },
    { key: 'overdue', label: '已超时' },
    { key: 'visiting', label: '待回访' },
    { key: 'closed', label: '已关闭' },
  ],
  activeQuickFilter: null,

  setSelectedComplaint: (complaint) => set({ selectedComplaint: complaint }),
  setSelectedComplaintId: (id) => set({ selectedComplaintId: id }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () => set({ filters: { ...defaultFilters } }),

  setActiveQuickFilter: (key) => set({ activeQuickFilter: key }),
}));

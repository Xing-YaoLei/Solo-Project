import { create } from 'zustand';
import type { Prescription, ExceptionRecord } from '@/types';
import { prescriptions as mockPrescriptions, exceptionRecords as mockExceptions } from '@/mock/data';

interface PrescriptionState {
  prescriptions: Prescription[];
  exceptions: ExceptionRecord[];
  selectedIds: string[];
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  updatePrescriptionStatus: (id: string, status: Prescription['status']) => void;
  batchUpdateStatus: (ids: string[], status: Prescription['status']) => void;
  updateExceptionStatus: (id: string, status: ExceptionRecord['status'], resolution?: string) => void;
}

export const usePrescriptionStore = create<PrescriptionState>((set, get) => ({
  prescriptions: mockPrescriptions,
  exceptions: mockExceptions,
  selectedIds: [],
  toggleSelect: (id) => {
    const { selectedIds } = get();
    set({
      selectedIds: selectedIds.includes(id)
        ? selectedIds.filter((i) => i !== id)
        : [...selectedIds, id],
    });
  },
  selectAll: () => {
    set({ selectedIds: get().prescriptions.map((p) => p.id) });
  },
  clearSelection: () => set({ selectedIds: [] }),
  updatePrescriptionStatus: (id, status) => {
    set((state) => ({
      prescriptions: state.prescriptions.map((p) =>
        p.id === id ? { ...p, status } : p
      ),
    }));
  },
  batchUpdateStatus: (ids, status) => {
    set((state) => ({
      prescriptions: state.prescriptions.map((p) =>
        ids.includes(p.id) ? { ...p, status } : p
      ),
      selectedIds: [],
    }));
  },
  updateExceptionStatus: (id, status, resolution) => {
    set((state) => ({
      exceptions: state.exceptions.map((e) =>
        e.id === id
          ? { ...e, status, resolution: resolution || e.resolution, resolved_at: status === 'resolved' || status === 'closed' ? new Date().toISOString() : e.resolved_at }
          : e
      ),
    }));
  },
}));

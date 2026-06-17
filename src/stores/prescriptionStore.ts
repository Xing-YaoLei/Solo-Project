import { create } from 'zustand';
import type { Prescription, ExceptionRecord, TimelineEvent } from '@/types';
import { prescriptions as mockPrescriptions, exceptionRecords as mockExceptions, users } from '@/mock/data';
import { prescriptionApi, exceptionApi } from '@/api';
import type { ExceptionCreateRequest, ExceptionUpdateRequest } from '@/api/types';

interface PrescriptionState {
  prescriptions: Prescription[];
  exceptions: ExceptionRecord[];
  selectedIds: string[];
  loading: boolean;
  error: string | null;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  updatePrescriptionStatus: (id: string, status: Prescription['status']) => void;
  batchUpdateStatus: (ids: string[], status: Prescription['status']) => void;
  updateExceptionStatus: (id: string, status: ExceptionRecord['status'], resolution?: string) => void;
  markException: (prescriptionId: string, data: ExceptionCreateRequest) => Promise<{ prescription: Prescription; exception: ExceptionRecord | null } | null>;
  updateException: (id: string, data: ExceptionUpdateRequest) => Promise<ExceptionRecord | null>;
  refreshException: (id: string) => Promise<void>;
  addTimelineEvent: (prescriptionId: string, event: TimelineEvent) => void;
}

export const usePrescriptionStore = create<PrescriptionState>((set, get) => ({
  prescriptions: mockPrescriptions,
  exceptions: mockExceptions,
  selectedIds: [],
  loading: false,
  error: null,
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
    const now = new Date().toISOString();
    set((state) => ({
      exceptions: state.exceptions.map((e) =>
        e.id === id
          ? {
              ...e,
              status,
              resolution: resolution ?? e.resolution,
              resolved_at:
                status === 'resolved' || status === 'closed'
                  ? now
                  : e.resolved_at,
              updated_at: now,
            }
          : e
      ),
    }));
  },
  markException: async (prescriptionId, data) => {
    set({ loading: true, error: null });
    try {
      let newException: ExceptionRecord | null = null;
      let updatedPrescription: Prescription | null = null;

      try {
        const res = await prescriptionApi.markException(prescriptionId, data);
        const pres = res.data;
        updatedPrescription = pres;
      } catch (apiError) {
        console.warn('API unavailable, creating mock exception');
      }

      const now = new Date().toISOString();
      const assigneeUser = data.assignee_id
        ? users.find((u) => u.id === data.assignee_id)
        : null;
      const prescription = get().prescriptions.find(
        (p) => p.id === prescriptionId
      );

      const exceptionId = `exc-${Date.now()}`;
      newException = {
        id: exceptionId,
        exception_no: `EXC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        prescription_id: prescriptionId,
        prescription_no: prescription?.prescription_no || '',
        exception_type: data.exception_type,
        severity: data.severity as 'low' | 'medium' | 'high' | 'critical',
        impact_scope: data.impact_scope,
        reason: data.description || '未提供原因',
        status: 'open' as const,
        assignee_id: data.assignee_id ?? null,
        assignee_name: assigneeUser?.username || '未分配',
        resolution: null,
        created_at: now,
        updated_at: now,
        resolved_at: null,
      };

      const timelineEvent: TimelineEvent = {
        id: `tl-${Date.now()}`,
        timestamp: now,
        action: '标记异常',
        actor: '当前审核员',
        detail: `原因：${data.description || data.exception_type}；影响范围：${data.impact_scope}${assigneeUser ? `；指派给：${assigneeUser.username}` : ''}`,
        status: 'exception',
      };

      set((state) => {
        const newPrescriptions = state.prescriptions.map((p) =>
          p.id === prescriptionId
            ? {
                ...p,
                status: 'exception' as const,
                updated_at: now,
                timeline: [...p.timeline, timelineEvent],
              }
            : p
        );
        return {
          prescriptions: newPrescriptions,
          exceptions: [...state.exceptions, newException!],
          loading: false,
        };
      });

      const finalPrescription =
        get().prescriptions.find((p) => p.id === prescriptionId) || null;
      return {
        prescription: finalPrescription!,
        exception: newException,
      };
    } catch (e) {
      set({ loading: false, error: '标记异常失败' });
      return null;
    }
  },
  updateException: async (id, data) => {
    set({ loading: true, error: null });
    try {
      try {
        await exceptionApi.update(id, data);
      } catch (apiError) {
        console.warn('API unavailable, updating mock exception');
      }

      const now = new Date().toISOString();
      let updatedException: ExceptionRecord | null = null;
      const prevException = get().exceptions.find((e) => e.id === id);

      set((state) => ({
        exceptions: state.exceptions.map((e) => {
          if (e.id !== id) return e;
          updatedException = {
            ...e,
            ...data,
            resolved_at:
              data.status === 'resolved' || data.status === 'closed'
                ? now
                : e.resolved_at,
            updated_at: now,
          };
          return updatedException;
        }),
        loading: false,
      }));

      if (prevException && (data.status || data.resolution || data.impact_scope)) {
        const timelineDetail: string[] = [];
        if (data.status && prevException.status !== data.status) {
          timelineDetail.push(`状态变更：${prevException.status} → ${data.status}`);
        }
        if (data.resolution) {
          timelineDetail.push(`处理结论：${data.resolution}`);
        }
        if (data.impact_scope && prevException.impact_scope !== data.impact_scope) {
          timelineDetail.push(`影响范围更新：${data.impact_scope}`);
        }
        if (data.assignee_id) {
          const assignee = users.find((u) => u.id === data.assignee_id);
          if (assignee && prevException.assignee_id !== data.assignee_id) {
            timelineDetail.push(`转派人：${assignee.username}`);
          }
        }

        if (timelineDetail.length > 0) {
          const prescriptionId = prevException.prescription_id;
          const timelineEvent: TimelineEvent = {
            id: `tl-${Date.now()}`,
            timestamp: now,
            action: '异常更新',
            actor: '当前审核员',
            detail: timelineDetail.join('；'),
            status: data.status || prevException.status,
          };
          set((state) => ({
            prescriptions: state.prescriptions.map((p) =>
              p.id === prescriptionId
                ? { ...p, timeline: [...p.timeline, timelineEvent] }
                : p
            ),
          }));
        }
      }

      return updatedException;
    } catch (e) {
      set({ loading: false, error: '更新异常失败' });
      return null;
    }
  },
  refreshException: async (id) => {
    try {
      const res = await exceptionApi.get(id);
      const exc = res.data;
      set((state) => ({
        exceptions: state.exceptions.map((e) => (e.id === id ? exc : e)),
      }));
    } catch (e) {
      console.warn('Failed to refresh exception from API');
    }
  },
  addTimelineEvent: (prescriptionId, event) => {
    set((state) => ({
      prescriptions: state.prescriptions.map((p) =>
        p.id === prescriptionId
          ? { ...p, timeline: [...p.timeline, event] }
          : p
      ),
    }));
  },
}));

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
  convertApiException: (apiExc: any) => ExceptionRecord;
}

export const usePrescriptionStore = create<PrescriptionState>((set, get) => ({
  prescriptions: mockPrescriptions.map(p => ({ ...p, exceptions: mockExceptions.filter(e => e.prescription_id === p.id) })),
  exceptions: mockExceptions,
  selectedIds: [],
  loading: false,
  error: null,

  convertApiException: (apiExc: any): ExceptionRecord => {
    const reason = apiExc.description || apiExc.reason || '未提供原因';
    const severity = (apiExc.severity as 'low' | 'medium' | 'high' | 'critical') || 'medium';
    const status = apiExc.status === 'in_progress' ? 'processing' : (apiExc.status as ExceptionRecord['status']);
    const assignee = apiExc.assignee_id
      ? users.find((u) => u.id === apiExc.assignee_id)
      : null;
    const prescription = get().prescriptions.find((p) => p.id === apiExc.prescription_id);

    return {
      id: apiExc.id,
      exception_no: apiExc.exception_no || '',
      prescription_id: apiExc.prescription_id,
      prescription_no: apiExc.prescription_no || prescription?.prescription_no || '',
      exception_type: apiExc.exception_type,
      severity,
      reason,
      impact_scope: apiExc.impact_scope,
      assignee_id: apiExc.assignee_id ?? null,
      assignee_name: apiExc.assignee_name || assignee?.username || '未分配',
      status,
      resolution: apiExc.resolution ?? null,
      created_at: apiExc.created_at,
      updated_at: apiExc.updated_at,
      resolved_at: apiExc.resolved_at ?? null,
    };
  },

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
      const now = new Date().toISOString();

      try {
        const res = await prescriptionApi.markException(prescriptionId, data);
        const apiPrescription = res.data;

        const apiException = apiPrescription.exceptions?.[0];
        if (apiException) {
          newException = get().convertApiException(apiException);
        }

        const existingPrescription = get().prescriptions.find((p) => p.id === prescriptionId);
        updatedPrescription = {
          ...existingPrescription!,
          id: apiPrescription.id,
          status: apiPrescription.status as Prescription['status'],
          updated_at: now,
          exceptions: apiPrescription.exceptions?.map((e: any) => get().convertApiException(e)) || [],
          timeline: existingPrescription!.timeline.concat([{
            id: `tl-${Date.now()}`,
            timestamp: now,
            action: '标记异常',
            actor: '当前审核员',
            detail: `原因：${data.description || data.exception_type}；影响范围：${data.impact_scope}${data.assignee_id ? `；指派给：${users.find(u => u.id === data.assignee_id)?.username || ''}` : ''}`,
            status: 'exception',
          }]),
        };
      } catch (apiError) {
        console.warn('API unavailable, creating mock exception');
        throw apiError;
      }

      if (updatedPrescription && newException) {
        set((state) => {
          const newPrescriptions = state.prescriptions.map((p) =>
            p.id === prescriptionId ? updatedPrescription! : p
          );
          const newExceptions = state.exceptions.some(e => e.id === newException!.id)
            ? state.exceptions.map(e => e.id === newException!.id ? newException! : e)
            : [...state.exceptions, newException!];
          return {
            prescriptions: newPrescriptions,
            exceptions: newExceptions,
            loading: false,
          };
        });

        return {
          prescription: updatedPrescription,
          exception: newException,
        };
      }

      return null;
    } catch (e) {
      console.error('markException error:', e);
      set({ loading: false, error: '标记异常失败' });
      return null;
    }
  },

  updateException: async (id, data) => {
    set({ loading: true, error: null });
    try {
      let updatedException: ExceptionRecord | null = null;
      const now = new Date().toISOString();
      const prevException = get().exceptions.find((e) => e.id === id);

      try {
        const res = await exceptionApi.update(id, data);
        updatedException = get().convertApiException(res.data);
      } catch (apiError) {
        console.warn('API unavailable, updating mock exception');
        throw apiError;
      }

      if (updatedException) {
        set((state) => ({
          exceptions: state.exceptions.map((e) =>
            e.id === id ? updatedException! : e
          ),
          loading: false,
        }));

        if (prevException && (data.status || data.resolution || data.impact_scope || data.assignee_id)) {
          const timelineDetail: string[] = [];
          if (data.status && prevException.status !== data.status) {
            const displayPrev = prevException.status === 'processing' ? '处理中' : 
              prevException.status === 'open' ? '待处理' :
              prevException.status === 'resolved' ? '已解决' : '已关闭';
            const displayNew = data.status === 'processing' ? '处理中' :
              data.status === 'open' ? '待处理' :
              data.status === 'resolved' ? '已解决' : '已关闭';
            timelineDetail.push(`状态变更：${displayPrev} → ${displayNew}`);
          }
          if (data.resolution && prevException.resolution !== data.resolution) {
            timelineDetail.push(`处理结论：${data.resolution}`);
          }
          if (data.impact_scope && prevException.impact_scope !== data.impact_scope) {
            timelineDetail.push(`影响范围更新：${data.impact_scope}`);
          }
          if (data.assignee_id && prevException.assignee_id !== data.assignee_id) {
            const assignee = users.find((u) => u.id === data.assignee_id);
            timelineDetail.push(`转派人：${assignee?.username || '未分配'}`);
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
      }

      return updatedException;
    } catch (e) {
      console.error('updateException error:', e);
      set({ loading: false, error: '更新异常失败' });
      return null;
    }
  },

  refreshException: async (id) => {
    try {
      const res = await exceptionApi.get(id);
      const exc = get().convertApiException(res.data);
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

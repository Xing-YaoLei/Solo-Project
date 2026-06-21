import { create } from 'zustand';
import type {
  VerificationRecord,
  VerificationRecordQuery,
  PagedResult,
  ConfirmationDto,
  SupplementDto,
  CloseDto,
  DamageReportDto,
  ResponsibilityAdjustmentDto,
} from '@/types';
import * as api from '@/api/verification';
import { mockRecords } from '@/mock/data/verificationRecords';

interface VerificationState {
  records: VerificationRecord[];
  currentRecord: VerificationRecord | null;
  totalCount: number;
  page: number;
  pageSize: number;
  loading: boolean;
  detailLoading: boolean;
  useMock: boolean;

  fetchRecords: (params?: VerificationRecordQuery) => Promise<void>;
  fetchRecordById: (id: string) => Promise<void>;
  confirmRecord: (id: string, dto: ConfirmationDto) => Promise<void>;
  supplementRecord: (id: string, dto: SupplementDto) => Promise<void>;
  closeRecord: (id: string, dto: CloseDto) => Promise<void>;
  reportDamage: (id: string, dto: DamageReportDto) => Promise<void>;
  adjustResponsibility: (
    id: string,
    dto: ResponsibilityAdjustmentDto
  ) => Promise<void>;
  setUseMock: (useMock: boolean) => void;
}

function filterMockRecords(
  params?: VerificationRecordQuery
): PagedResult<VerificationRecord> {
  let filtered = [...mockRecords];

  if (params?.keyword) {
    const kw = params.keyword.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.recordNo.toLowerCase().includes(kw) ||
        r.rider?.name.toLowerCase().includes(kw) ||
        r.order?.orderNumber.toLowerCase().includes(kw)
    );
  }

  if (params?.status) {
    filtered = filtered.filter((r) => r.status === params.status);
  }

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const totalCount = filtered.length;
  const items = filtered.slice((page - 1) * pageSize, page * pageSize);

  return { items, totalCount, page, pageSize };
}

export const useVerificationStore = create<VerificationState>((set, get) => ({
  records: [],
  currentRecord: null,
  totalCount: 0,
  page: 1,
  pageSize: 20,
  loading: false,
  detailLoading: false,
  useMock: true,

  setUseMock: (useMock: boolean) => set({ useMock }),

  fetchRecords: async (params?: VerificationRecordQuery) => {
    set({ loading: true });
    try {
      if (get().useMock) {
        const result = filterMockRecords(params);
        set({
          records: result.items,
          totalCount: result.totalCount,
          page: result.page,
          pageSize: result.pageSize,
          loading: false,
        });
        return;
      }
      const result = await api.fetchVerificationRecords(params);
      set({
        records: result.items,
        totalCount: result.totalCount,
        page: result.page,
        pageSize: result.pageSize,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  fetchRecordById: async (id: string) => {
    set({ detailLoading: true });
    try {
      if (get().useMock) {
        const record = mockRecords.find((r) => r.id === id) ?? null;
        set({ currentRecord: record, detailLoading: false });
        return;
      }
      const record = await api.fetchVerificationRecordById(id);
      set({ currentRecord: record, detailLoading: false });
    } catch {
      set({ detailLoading: false });
    }
  },

  confirmRecord: async (id: string, dto: ConfirmationDto) => {
    try {
      if (get().useMock) {
        set((state) => ({
          records: state.records.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: VerificationStatus.Confirmed,
                  stage: VerificationStage.Action,
                  confirmedAt: new Date().toISOString(),
                }
              : r
          ),
          currentRecord: state.currentRecord?.id === id
            ? {
                ...state.currentRecord,
                status: VerificationStatus.Confirmed,
                stage: VerificationStage.Action,
                confirmedAt: new Date().toISOString(),
              }
            : state.currentRecord,
        }));
        return;
      }
      await api.confirmRecord(id, dto);
      await get().fetchRecordById(id);
    } catch {
      // handle error
    }
  },

  supplementRecord: async (id: string, dto: SupplementDto) => {
    try {
      if (get().useMock) {
        set((state) => ({
          records: state.records.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: VerificationStatus.Supplemented,
                  supplementedAt: new Date().toISOString(),
                  remark: dto.remark ?? r.remark,
                  ratingTags: dto.ratingTags ?? r.ratingTags,
                }
              : r
          ),
          currentRecord: state.currentRecord?.id === id
            ? {
                ...state.currentRecord,
                status: VerificationStatus.Supplemented,
                supplementedAt: new Date().toISOString(),
                remark: dto.remark ?? state.currentRecord.remark,
                ratingTags: dto.ratingTags ?? state.currentRecord.ratingTags,
              }
            : state.currentRecord,
        }));
        return;
      }
      await api.supplementRecord(id, dto);
      await get().fetchRecordById(id);
    } catch {
      // handle error
    }
  },

  closeRecord: async (id: string, dto: CloseDto) => {
    try {
      if (get().useMock) {
        set((state) => ({
          records: state.records.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: VerificationStatus.Closed,
                  stage: VerificationStage.Review,
                  closedAt: new Date().toISOString(),
                }
              : r
          ),
          currentRecord: state.currentRecord?.id === id
            ? {
                ...state.currentRecord,
                status: VerificationStatus.Closed,
                stage: VerificationStage.Review,
                closedAt: new Date().toISOString(),
              }
            : state.currentRecord,
        }));
        return;
      }
      await api.closeRecord(id, dto);
      await get().fetchRecordById(id);
    } catch {
      // handle error
    }
  },

  reportDamage: async (id: string, dto: DamageReportDto) => {
    try {
      if (get().useMock) {
        set((state) => ({
          records: state.records.map((r) =>
            r.id === id
              ? { ...r, status: VerificationStatus.Damaged, stage: VerificationStage.Review }
              : r
          ),
          currentRecord: state.currentRecord?.id === id
            ? {
                ...state.currentRecord,
                status: VerificationStatus.Damaged,
                stage: VerificationStage.Review,
              }
            : state.currentRecord,
        }));
        return;
      }
      await api.reportDamage(id, dto);
      await get().fetchRecordById(id);
    } catch {
      // handle error
    }
  },

  adjustResponsibility: async (
    id: string,
    dto: ResponsibilityAdjustmentDto
  ) => {
    try {
      if (get().useMock) {
        set((state) => ({
          currentRecord: state.currentRecord?.id === id
            ? {
                ...state.currentRecord,
                damageReports: state.currentRecord.damageReports.map((dr) => ({
                  ...dr,
                  finalResponsibility: dto.finalResponsibility,
                  responsibilityAdjustedBy: dto.adjustedBy,
                  supplementaryNotes: dto.supplementaryNotes,
                })),
              }
            : state.currentRecord,
        }));
        return;
      }
      await api.adjustResponsibility(id, dto);
      await get().fetchRecordById(id);
    } catch {
      // handle error
    }
  },
}));

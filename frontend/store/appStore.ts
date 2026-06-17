import { create } from 'zustand';
import type { RepairOrder, Material, RepairPerson, OrderStatus, OrderSource } from '../types';
import { repairOrderApi, materialApi, repairPersonApi } from '../services/api';

interface AppState {
  orders: RepairOrder[];
  totalOrders: number;
  selectedOrder: RepairOrder | null;
  commonMaterials: Material[];
  repairPersons: RepairPerson[];
  loading: boolean;
  filters: {
    status?: OrderStatus;
    source?: OrderSource;
    assignPersonId?: string;
    keyword?: string;
    page: number;
    pageSize: number;
  };

  setFilters: (filters: Partial<AppState['filters']>) => void;
  fetchOrders: () => Promise<void>;
  fetchOrderDetail: (id: string) => Promise<void>;
  selectOrder: (order: RepairOrder | null) => void;
  fetchCommonMaterials: () => Promise<void>;
  fetchRepairPersons: () => Promise<void>;
  refreshOrders: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  orders: [],
  totalOrders: 0,
  selectedOrder: null,
  commonMaterials: [],
  repairPersons: [],
  loading: false,
  filters: {
    status: undefined,
    source: undefined,
    assignPersonId: undefined,
    keyword: undefined,
    page: 1,
    pageSize: 20,
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
    get().fetchOrders();
  },

  fetchOrders: async () => {
    set({ loading: true });
    try {
      const { filters } = get();
      const result = await repairOrderApi.list(filters);
      set({
        orders: result.list,
        totalOrders: result.total,
      });
    } catch (error) {
      console.error('获取派单列表失败', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchOrderDetail: async (id: string) => {
    try {
      const order = await repairOrderApi.get(id);
      set({ selectedOrder: order });
    } catch (error) {
      console.error('获取派单详情失败', error);
    }
  },

  selectOrder: (order) => {
    set({ selectedOrder: order });
  },

  fetchCommonMaterials: async () => {
    try {
      const materials = await materialApi.getCommon();
      set({ commonMaterials: materials });
    } catch (error) {
      console.error('获取常用材料失败', error);
    }
  },

  fetchRepairPersons: async () => {
    try {
      const persons = await repairPersonApi.list();
      set({ repairPersons: persons });
    } catch (error) {
      console.error('获取维修人员失败', error);
    }
  },

  refreshOrders: async () => {
    await get().fetchOrders();
    if (get().selectedOrder) {
      await get().fetchOrderDetail(get().selectedOrder!.id);
    }
  },
}));

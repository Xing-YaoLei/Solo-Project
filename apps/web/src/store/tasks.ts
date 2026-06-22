import { create } from 'zustand';
import type { TaskStatus, TaskPriority } from '@/lib/api/types';

interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  auditorId?: string;
  ownerId?: string;
  keyword?: string;
}

interface TasksState {
  filters: TaskFilters;
  selectedTaskIds: string[];
  currentPage: number;
  pageSize: number;
  sortField?: string;
  sortOrder?: 'ascend' | 'descend';
  viewMode: 'list' | 'kanban';
  setFilters: (filters: Partial<TaskFilters>) => void;
  resetFilters: () => void;
  setSelectedTaskIds: (ids: string[]) => void;
  toggleTaskSelection: (id: string) => void;
  clearSelection: () => void;
  setPagination: (page: number, pageSize: number) => void;
  setSort: (field?: string, order?: 'ascend' | 'descend') => void;
  setViewMode: (mode: 'list' | 'kanban') => void;
}

const defaultFilters: TaskFilters = {
  status: undefined,
  priority: undefined,
  auditorId: undefined,
  ownerId: undefined,
  keyword: undefined,
};

export const useTasksStore = create<TasksState>((set, get) => ({
  filters: defaultFilters,
  selectedTaskIds: [],
  currentPage: 1,
  pageSize: 10,
  sortField: undefined,
  sortOrder: undefined,
  viewMode: 'kanban',

  setFilters: (newFilters: Partial<TaskFilters>) => {
    set({
      filters: { ...get().filters, ...newFilters },
      currentPage: 1,
    });
  },

  resetFilters: () => {
    set({
      filters: defaultFilters,
      currentPage: 1,
      sortField: undefined,
      sortOrder: undefined,
    });
  },

  setSelectedTaskIds: (ids: string[]) => {
    set({ selectedTaskIds: ids });
  },

  toggleTaskSelection: (id: string) => {
    const { selectedTaskIds } = get();
    if (selectedTaskIds.includes(id)) {
      set({ selectedTaskIds: selectedTaskIds.filter((i) => i !== id) });
    } else {
      set({ selectedTaskIds: [...selectedTaskIds, id] });
    }
  },

  clearSelection: () => {
    set({ selectedTaskIds: [] });
  },

  setPagination: (page: number, pageSize: number) => {
    set({ currentPage: page, pageSize });
  },

  setSort: (field?: string, order?: 'ascend' | 'descend') => {
    set({ sortField: field, sortOrder: order });
  },

  setViewMode: (mode: 'list' | 'kanban') => {
    set({ viewMode: mode });
  },
}));

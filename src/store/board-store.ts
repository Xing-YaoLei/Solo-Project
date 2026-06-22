import { create } from "zustand"
import type { BoardGroup, BoardGroupBy, TicketStatus } from "@/lib/types"

interface BoardFilters {
  status: TicketStatus | null
  department: string | null
}

interface BoardState {
  groupBy: BoardGroupBy
  groups: BoardGroup[]
  filters: BoardFilters
  setGroupBy: (groupBy: BoardGroupBy) => void
  setGroups: (groups: BoardGroup[]) => void
  setFilters: (filters: Partial<BoardFilters>) => void
  reset: () => void
}

const initialFilters: BoardFilters = {
  status: null,
  department: null,
}

export const useBoardStore = create<BoardState>((set) => ({
  groupBy: "review_opinion",
  groups: [],
  filters: initialFilters,
  setGroupBy: (groupBy) => set({ groupBy }),
  setGroups: (groups) => set({ groups }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  reset: () =>
    set({
      groupBy: "review_opinion",
      groups: [],
      filters: initialFilters,
    }),
}))

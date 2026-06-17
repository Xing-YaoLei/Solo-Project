import { create } from "zustand";
import type { DateRange, FilterState } from "./types";

export type { DateRange, FilterState } from "./types";

interface FilterStore {
  dateRange: DateRange;
  area: string;
  repairType: string;
  driver: string;
  setDateRange: (range: DateRange) => void;
  setArea: (area: string) => void;
  setRepairType: (type: string) => void;
  setDriver: (driver: string) => void;
  resetFilters: () => void;
}

const today = new Date();
const thirtyDaysAgo = new Date(today);
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const defaultRange: DateRange = {
  start: thirtyDaysAgo.toISOString().split("T")[0],
  end: today.toISOString().split("T")[0],
};

export const useFilterStore = create<FilterStore>((set) => ({
  dateRange: defaultRange,
  area: "",
  repairType: "",
  driver: "",
  setDateRange: (range) => set({ dateRange: range }),
  setArea: (area) => set({ area }),
  setRepairType: (type) => set({ repairType: type }),
  setDriver: (driver) => set({ driver }),
  resetFilters: () =>
    set({
      dateRange: defaultRange,
      area: "",
      repairType: "",
      driver: "",
    }),
}));

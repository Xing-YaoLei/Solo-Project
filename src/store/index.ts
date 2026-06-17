import { create } from 'zustand';
import type { User, UserRole } from '../../shared/types';

interface AppState {
  user: User | null;
  dataScope: {
    areas: string[];
    roles: UserRole[];
  } | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setDataScope: (scope: { areas: string[]; roles: UserRole[] } | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

const initialState = {
  user: null,
  dataScope: null,
  isLoading: false,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setUser: (user) => set({ user }),

  setDataScope: (scope) => set({ dataScope: scope }),

  setLoading: (loading) => set({ isLoading: loading }),

  logout: () => set({ ...initialState }),
}));

export const useCurrentUser = () => useAppStore((state) => state.user);
export const useCurrentRole = () => useAppStore((state) => state.user?.role);
export const useCurrentArea = () => useAppStore((state) => state.user?.area);
export const useDataScope = () => useAppStore((state) => state.dataScope);
export const useIsLoading = () => useAppStore((state) => state.isLoading);

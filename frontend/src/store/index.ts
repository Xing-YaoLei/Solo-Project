import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole, KPIData, DateRange } from '../types';
import { login, logout, getCurrentUser } from '../services/auth';
import { removeToken, getToken } from '../utils/request';

interface AppState {
  user: User | null;
  loading: boolean;
  darkMode: boolean;
  selectedDateRange: DateRange | null;
  selectedArea: string | null;
  kpiData: KPIData | null;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;
  setSelectedDateRange: (range: DateRange | null) => void;
  setSelectedArea: (area: string | null) => void;
  setKpiData: (data: KPIData | null) => void;
  setUser: (user: User | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      darkMode: false,
      selectedDateRange: null,
      selectedArea: null,
      kpiData: null,

      login: async (username: string, password: string) => {
        set({ loading: true });
        try {
          const response = await login(username, password);
          set({ user: response.user, loading: false });
          return response.user;
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ loading: true });
        try {
          await logout();
        } finally {
          set({ user: null, loading: false, kpiData: null });
          removeToken();
        }
      },

      checkAuth: async () => {
        const token = getToken();
        if (!token) {
          set({ user: null });
          return;
        }

        try {
          set({ loading: true });
          const user = await getCurrentUser();
          set({ user, loading: false });
        } catch {
          set({ user: null, loading: false });
          removeToken();
        }
      },

      setDarkMode: (dark: boolean) => set({ darkMode: dark }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      setSelectedDateRange: (range) => set({ selectedDateRange: range }),
      setSelectedArea: (area) => set({ selectedArea: area }),
      setKpiData: (data) => set({ kpiData: data }),
      setUser: (user) => set({ user }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        user: state.user,
        darkMode: state.darkMode,
        selectedDateRange: state.selectedDateRange,
        selectedArea: state.selectedArea,
      }),
    }
  )
);

export const useUser = () => useStore((state) => state.user);
export const useLoading = () => useStore((state) => state.loading);
export const useDarkMode = () => useStore((state) => state.darkMode);
export const useUserRole = (): UserRole | null => {
  const user = useStore((state) => state.user);
  return user?.role || null;
};
export const hasRole = (role: UserRole | UserRole[]): boolean => {
  const user = useStore.getState().user;
  if (!user) return false;
  if (Array.isArray(role)) {
    return role.includes(user.role);
  }
  return user.role === role;
};
export const isAdmin = (): boolean => {
  const user = useStore.getState().user;
  return user?.role === 'admin';
};

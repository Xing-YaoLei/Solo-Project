import { create } from 'zustand';

interface AppState {
  theme: 'dark' | 'light';
  sidebarCollapsed: boolean;
  currentCaliberVersion: string;
  loading: Record<string, boolean>;

  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setCurrentCaliberVersion: (version: string) => void;
  setLoading: (key: string, value: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  sidebarCollapsed: false,
  currentCaliberVersion: '',
  loading: {},

  setTheme: (theme) => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
    set({ theme });
  },

  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(next);
      localStorage.setItem('theme', next);
      return { theme: next };
    }),

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setCurrentCaliberVersion: (version) => set({ currentCaliberVersion: version }),
  setLoading: (key, value) =>
    set((state) => ({ loading: { ...state.loading, [key]: value } })),
}));

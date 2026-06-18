import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UserRole = 'store_manager' | 'region_ops' | 'risk_admin' | 'management';

interface User {
  id: string;
  name: string;
  role: UserRole;
  storeId?: string;
}

interface UserState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

interface UserActions {
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useUserStore = create<UserState & UserActions>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
      setUser: (user) => set({ user }),
    }),
    {
      name: 'user-storage',
    }
  )
);

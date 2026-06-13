import { create } from 'zustand';
import { User } from '@solo/shared';

interface AuthState {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
}));

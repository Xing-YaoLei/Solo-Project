import { create } from "zustand"
import type { AuthUser, UserRole } from "@/lib/types"

interface AuthState {
  user: AuthUser | null
  token: string | null
  role: UserRole | null
  isAuthenticated: boolean
  login: (user: AuthUser, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  role: null,
  isAuthenticated: false,
  login: (user, token) =>
    set({
      user,
      token,
      role: user.role,
      isAuthenticated: true,
    }),
  logout: () =>
    set({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,
    }),
}))

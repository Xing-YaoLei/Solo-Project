import { create } from "zustand";
import { UserRole, getRolePermissions, RolePermissions } from "@/types";

interface AppState {
  currentRole: UserRole;
  permissions: RolePermissions;
  shareToken: string | null;
  shareModalOpen: boolean;
  setRole: (role: UserRole) => void;
  setShareToken: (token: string | null) => void;
  setShareModalOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentRole: "director",
  permissions: getRolePermissions("director"),
  shareToken: null,
  shareModalOpen: false,
  setRole: (role) =>
    set({
      currentRole: role,
      permissions: getRolePermissions(role),
    }),
  setShareToken: (token) => set({ shareToken: token }),
  setShareModalOpen: (open) => set({ shareModalOpen: open }),
}));

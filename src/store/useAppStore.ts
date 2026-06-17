import { create } from 'zustand';
import type { UserRole, UserRoleType, TodoItem, TodoStatus } from '@/types';
import { mockUsers, mockTodoItems } from '@/data/mockData';

interface AppState {
  currentUser: UserRole;
  allUsers: UserRole[];
  todoItems: TodoItem[];
  sidebarCollapsed: boolean;
  setCurrentUser: (user: UserRole) => void;
  setRole: (role: UserRoleType) => void;
  toggleSidebar: () => void;
  updateTodoStatus: (id: string, status: TodoStatus) => void;
  addTodoItem: (item: TodoItem) => void;
  getAccessibleRoutes: () => string[];
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: mockUsers[1],
  allUsers: mockUsers,
  todoItems: mockTodoItems,
  sidebarCollapsed: false,

  setCurrentUser: (user) => set({ currentUser: user }),

  setRole: (role) => {
    const user = mockUsers.find((u) => u.role === role);
    if (user) set({ currentUser: user });
  },

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  updateTodoStatus: (id, status) =>
    set((state) => ({
      todoItems: state.todoItems.map((item) =>
        item.id === id ? { ...item, status } : item
      ),
    })),

  addTodoItem: (item) =>
    set((state) => ({ todoItems: [item, ...state.todoItems] })),

  getAccessibleRoutes: () => get().currentUser.accessibleRoutes,
}));

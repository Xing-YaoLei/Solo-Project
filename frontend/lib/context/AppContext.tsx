"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  Task,
  TaskStatus,
  Project,
  Reminder,
  Statistics,
  ChatMessage,
  User,
} from "@/lib/types";
import {
  mockTasks,
  mockProjects,
  mockReminders,
  mockStatistics,
  mockUsers,
} from "@/lib/data/mockData";
import { generateId } from "@/lib/utils";
import { useAuth } from "./AuthContext";

interface AppContextType {
  tasks: Task[];
  projects: Project[];
  reminders: Reminder[];
  statistics: Statistics;
  users: User[];
  getTaskById: (id: string) => Task | undefined;
  getProjectById: (id: string) => Project | undefined;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  addChatMessage: (taskId: string, content: string) => void;
  markReminderAsRead: (reminderId: string) => void;
  markAllRemindersAsRead: () => void;
  unreadRemindersCount: number;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [projects] = useState<Project[]>(mockProjects);
  const [reminders, setReminders] = useState<Reminder[]>(mockReminders);
  const [statistics] = useState<Statistics>(mockStatistics);
  const [users] = useState<User[]>(mockUsers);
  const [isLoading] = useState(false);
  const { user } = useAuth();

  const getTaskById = useCallback(
    (id: string) => {
      return tasks.find((t) => t.id === id);
    },
    [tasks]
  );

  const getProjectById = useCallback(
    (id: string) => {
      return projects.find((p) => p.id === id);
    },
    [projects]
  );

  const updateTaskStatus = useCallback((taskId: string, status: TaskStatus) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status,
              updatedAt: new Date().toISOString(),
              completedAt:
                status === TaskStatus.APPROVED || status === TaskStatus.REJECTED
                  ? new Date().toISOString()
                  : undefined,
            }
          : task
      )
    );
  }, []);

  const addChatMessage = useCallback(
    (taskId: string, content: string) => {
      if (!user) return;

      const newMessage: ChatMessage = {
        id: generateId(),
        taskId,
        sender: user,
        content,
        createdAt: new Date().toISOString(),
      };

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                chatMessages: [...task.chatMessages, newMessage],
                updatedAt: new Date().toISOString(),
              }
            : task
        )
      );
    },
    [user]
  );

  const markReminderAsRead = useCallback((reminderId: string) => {
    setReminders((prevReminders) =>
      prevReminders.map((r) =>
        r.id === reminderId ? { ...r, isRead: true } : r
      )
    );
  }, []);

  const markAllRemindersAsRead = useCallback(() => {
    setReminders((prevReminders) =>
      prevReminders.map((r) => ({ ...r, isRead: true }))
    );
  }, []);

  const unreadRemindersCount = reminders.filter((r) => !r.isRead).length;

  return (
    <AppContext.Provider
      value={{
        tasks,
        projects,
        reminders,
        statistics,
        users,
        getTaskById,
        getProjectById,
        updateTaskStatus,
        addChatMessage,
        markReminderAsRead,
        markAllRemindersAsRead,
        unreadRemindersCount,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

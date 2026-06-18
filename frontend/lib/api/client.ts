import {
  Task,
  TaskStatus,
  TaskType,
  User,
  UserRole,
  Project,
  ChatMessage,
  QuoteVersion,
  Reminder,
} from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface ApiResponse<T> {
  data?: T;
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token");
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const data = await this.request<{ accessToken: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return { token: data.accessToken, user: data.user };
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    phone?: string;
  }): Promise<{ token: string; user: User }> {
    const result = await this.request<{ accessToken: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return { token: result.accessToken, user: result.user };
  }

  async getProfile(): Promise<User> {
    return this.request<User>("/auth/profile");
  }

  async getTasks(params?: {
    page?: number;
    limit?: number;
    status?: TaskStatus;
    type?: TaskType;
    projectId?: string;
    keyword?: string;
  }): Promise<{ data: Task[]; total: number; page: number; limit: number }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.status) searchParams.set("status", params.status);
    if (params?.type) searchParams.set("type", params.type);
    if (params?.projectId) searchParams.set("projectId", params.projectId);
    if (params?.keyword) searchParams.set("keyword", params.keyword);

    return this.request(`/confirmation-tasks?${searchParams.toString()}`);
  }

  async getTask(id: string): Promise<Task> {
    return this.request<Task>(`/confirmation-tasks/${id}`);
  }

  async createTask(data: Partial<Task>): Promise<Task> {
    return this.request<Task>("/confirmation-tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    return this.request<Task>(`/confirmation-tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    return this.request<Task>(`/confirmation-tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async assignTask(id: string, assignedToId: string): Promise<Task> {
    return this.request<Task>(`/confirmation-tasks/${id}/assign`, {
      method: "POST",
      body: JSON.stringify({ assignedToId }),
    });
  }

  async getProjects(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ data: Project[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.status) searchParams.set("status", params.status);

    return this.request(`/projects?${searchParams.toString()}`);
  }

  async getProject(id: string): Promise<Project> {
    return this.request<Project>(`/projects/${id}`);
  }

  async getChatMessages(taskId: string): Promise<ChatMessage[]> {
    return this.request<ChatMessage[]>(`/chat/tasks/${taskId}`);
  }

  async sendChatMessage(taskId: string, content: string): Promise<ChatMessage> {
    return this.request<ChatMessage>(`/chat`, {
      method: "POST",
      body: JSON.stringify({ taskId, content }),
    });
  }

  async getQuoteVersions(taskId: string): Promise<QuoteVersion[]> {
    return this.request<QuoteVersion[]>(`/quote-versions/task/${taskId}`);
  }

  async getReminders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
  }): Promise<{ data: Reminder[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.status) searchParams.set("status", params.status);
    if (params?.type) searchParams.set("type", params.type);

    return this.request(`/reminders?${searchParams.toString()}`);
  }

  async markReminderAsRead(id: string): Promise<Reminder> {
    return this.request<Reminder>(`/reminders/${id}/read`, {
      method: "PATCH",
    });
  }

  async markAllRemindersAsRead(): Promise<{ updated: number }> {
    return this.request<{ updated: number }>("/reminders/read-all", {
      method: "PATCH",
    });
  }

  async getUnreadRemindersCount(): Promise<{ unreadCount: number }> {
    return this.request<{ unreadCount: number }>("/reminders/unread-count");
  }

  async getReportStats(params?: {
    startDate?: string;
    endDate?: string;
    projectId?: string;
    taskType?: TaskType;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set("startDate", params.startDate);
    if (params?.endDate) searchParams.set("endDate", params.endDate);
    if (params?.projectId) searchParams.set("projectId", params.projectId);
    if (params?.taskType) searchParams.set("taskType", params.taskType);

    const [taskStats, confirmationTime, unconfirmedAmount, reworkReasons] = await Promise.all([
      this.request(`/reports/task-stats?${searchParams.toString()}`),
      this.request(`/reports/confirmation-time?${searchParams.toString()}`),
      this.request(`/reports/unconfirmed-amount?${searchParams.toString()}`),
      this.request(`/reports/rework-reasons?${searchParams.toString()}`),
    ]);

    return {
      taskStats,
      confirmationTime,
      unconfirmedAmount,
      reworkReasons,
    };
  }

  async getDashboardStats() {
    return this.request("/reports/dashboard-stats");
  }
}

export const api = new ApiClient();

import { UserDocument } from "~/models/user";
import { VehicleDocument } from "~/models/vehicle";
import { InspectionReportDocument } from "~/models/inspectionReport";
import { PreparationListDocument } from "~/models/preparationList";
import { TestDriveRecordDocument } from "~/models/testDriveRecord";
import { PriceQuoteDocument } from "~/models/priceQuote";
import { CommunicationDocument } from "~/models/communication";

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginResponse {
  user: UserDocument;
}

export interface VehicleListResponse {
  vehicles: VehicleDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface VehicleDetailResponse {
  vehicle: VehicleDocument & {
    inspectionReport?: InspectionReportDocument;
    preparationList?: PreparationListDocument;
    testDriveRecords?: TestDriveRecordDocument[];
    priceQuotes?: PriceQuoteDocument[];
    communications?: CommunicationDocument[];
  };
}

export interface StatisticsResponse {
  stageStats: { _id: string; count: number }[];
  riskStats: { _id: string; count: number }[];
  stockTrend: { date: string; stockIn: number }[];
  soldStats: { _id: string; count: number }[];
  avgDaysInStock: number;
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `请求失败: ${response.status}`);
  }

  return data as T;
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),
    register: (data: any) =>
      request<LoginResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    logout: () =>
      request<void>("/api/auth/logout", { method: "POST" }),
    me: () =>
      request<LoginResponse>("/api/auth/me", { method: "GET" }),
    init: () =>
      request<any>("/api/auth/init", { method: "POST" }),
  },
  vehicles: {
    list: (params?: {
      stage?: string;
      riskLevel?: string;
      search?: string;
      page?: number;
      limit?: number;
    }) => {
      const query = new URLSearchParams();
      if (params?.stage) query.append("stage", params.stage);
      if (params?.riskLevel) query.append("riskLevel", params.riskLevel);
      if (params?.search) query.append("search", params.search);
      if (params?.page) query.append("page", params.page.toString());
      if (params?.limit) query.append("limit", params.limit.toString());
      return request<VehicleListResponse>(
        `/api/vehicles?${query.toString()}`
      );
    },
    get: (id: string) =>
      request<VehicleDetailResponse>(`/api/vehicles/${id}`),
    create: (data: any) =>
      request<VehicleDetailResponse>("/api/vehicles", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<VehicleDetailResponse>(`/api/vehicles/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    updateStage: (id: string, stage: string) =>
      request<VehicleDetailResponse>(`/api/vehicles/${id}/stage`, {
        method: "PATCH",
        body: JSON.stringify({ stage }),
      }),
    delete: (id: string) =>
      request<void>(`/api/vehicles/${id}`, { method: "DELETE" }),
    statistics: () =>
      request<StatisticsResponse>("/api/vehicles/statistics"),
    addInspection: (id: string, data: any) =>
      request<any>(`/api/vehicles/${id}/inspection`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateInspection: (id: string, data: any) =>
      request<any>(`/api/vehicles/${id}/inspection`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    addPreparation: (id: string, data: any) =>
      request<any>(`/api/vehicles/${id}/preparation`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updatePreparation: (id: string, data: any) =>
      request<any>(`/api/vehicles/${id}/preparation`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    addTestDrive: (id: string, data: any) =>
      request<any>(`/api/vehicles/${id}/testdrive`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    addQuote: (id: string, data: any) =>
      request<any>(`/api/vehicles/${id}/quote`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    addCommunication: (id: string, data: any) =>
      request<any>(`/api/vehicles/${id}/communication`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    reviewCommunication: (
      vehicleId: string,
      commId: string,
      reviewNotes: string
    ) =>
      request<any>(
        `/api/vehicles/${vehicleId}/communication/${commId}/review`,
        {
          method: "PATCH",
          body: JSON.stringify({ reviewNotes }),
        }
      ),
  },
};

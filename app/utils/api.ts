import * as appointmentService from "../services/appointment.service.js";
import * as timeslotService from "../services/timeslot.service.js";
import * as capacityService from "../services/capacity.service.js";
import * as conflictService from "../services/conflict.service.js";
import * as attendanceService from "../services/attendance.service.js";
import * as analyticsService from "../services/attendance.service.js";
import { getAttachments } from "../services/upload.service.js";

type Query = Record<string, any>;

function qs(params: Query): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") usp.set(k, String(v));
  }
  return usp.toString();
}

async function ssrOrFetch<T>(
  path: string,
  ssr: () => Promise<T>,
  init?: RequestInit
): Promise<T> {
  const isServer = typeof window === "undefined";
  if (isServer) {
    return ssr();
  }
  const res = await fetch(path, init);
  if (!res.ok) {
    try {
      const data = await res.json().catch(() => ({}));
      return data as T;
    } catch {
      return {} as T;
    }
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  return {} as T;
}

export const api = {
  appointments: {
    list: (params: Query = {}) =>
      ssrOrFetch<any>(
        `/api/appointments?${qs(params)}`,
        () => appointmentService.getAppointments(params) as Promise<any>
      ),
    get: (id: string) =>
      ssrOrFetch<any>(
        `/api/appointments/${id}`,
        () => appointmentService.getAppointmentById(id) as Promise<any>
      ),
    create: (data: any) =>
      ssrOrFetch<any>(
        `/api/appointments`,
        () => appointmentService.createAppointment(data) as Promise<any>,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }
      ),
    updateStatus: (id: string, status: string, handler: string, remark?: string) =>
      ssrOrFetch<any>(
        `/api/appointments/${id}/status`,
        () => appointmentService.updateAppointmentStatus(id, status as any, handler, remark) as Promise<any>,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, handler, remark }) }
      ),
    addRemark: (id: string, handler: string, content: string) =>
      ssrOrFetch<any>(
        `/api/appointments/${id}/remark`,
        () => appointmentService.addRemark(id, handler, content) as Promise<any>,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ handler, content }) }
      ),
  },

  timeslots: {
    list: (params: Query = {}) =>
      ssrOrFetch<any>(
        `/api/timeslots?${qs(params)}`,
        () => timeslotService.getTimeSlots(params) as Promise<any>
      ),
    range: (start: string, end: string) =>
      ssrOrFetch<any>(
        `/api/timeslots/range?start=${start}&end=${end}`,
        () => timeslotService.getTimeSlotsByDateRange(start, end) as Promise<any>
      ),
    create: (data: any) =>
      ssrOrFetch<any>(
        `/api/timeslots`,
        () => timeslotService.createTimeSlot(data) as Promise<any>,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }
      ),
    capacity: (id: string) =>
      ssrOrFetch<any>(
        `/api/timeslots/${id}/capacity`,
        () => timeslotService.getSlotCapacity(id) as Promise<any>
      ),
  },

  capacity: {
    list: () =>
      ssrOrFetch<any>(
        `/api/capacity`,
        () => capacityService.getCapacityRules() as Promise<any>
      ),
    get: (courseType: string) =>
      ssrOrFetch<any>(
        `/api/capacity/${courseType}`,
        () => capacityService.getCapacityRuleByCourseType(courseType) as Promise<any>
      ),
    create: (data: any) =>
      ssrOrFetch<any>(
        `/api/capacity`,
        () => capacityService.createCapacityRule(data) as Promise<any>,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }
      ),
    update: (id: string, data: any) =>
      ssrOrFetch<any>(
        `/api/capacity/${id}`,
        () => capacityService.updateCapacityRule(id, data) as Promise<any>,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }
      ),
  },

  conflicts: {
    list: (params: Query = {}) =>
      ssrOrFetch<any>(
        `/api/conflicts?${qs(params)}`,
        () => conflictService.getConflicts(params) as Promise<any>
      ),
    forward: (id: string, assignedTo: string, assignedRole: string) =>
      ssrOrFetch<any>(
        `/api/conflicts/${id}/forward`,
        () => conflictService.forwardConflict(id, assignedTo, assignedRole as any) as Promise<any>,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignedTo, assignedRole }) }
      ),
    supplement: (id: string, supplementNote: string, handler: string) =>
      ssrOrFetch<any>(
        `/api/conflicts/${id}/supplement`,
        () => conflictService.supplementConflict(id, supplementNote, handler) as Promise<any>,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ supplementNote, handler }) }
      ),
    resolve: (id: string, resolvedBy: string) =>
      ssrOrFetch<any>(
        `/api/conflicts/${id}/resolve`,
        () => conflictService.resolveConflict(id, resolvedBy) as Promise<any>,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resolvedBy }) }
      ),
  },

  attendance: {
    reminder: () =>
      ssrOrFetch<any>(
        `/api/attendance/reminder`,
        () => attendanceService.getReminderList() as Promise<any>
      ),
    bySlot: (slotId: string) =>
      ssrOrFetch<any>(
        `/api/attendance/slot/${slotId}`,
        () => attendanceService.getAttendanceBySlot(slotId) as Promise<any>
      ),
    checkIn: (data: any) =>
      ssrOrFetch<any>(
        `/api/attendance/checkin`,
        () => attendanceService.checkIn(data) as Promise<any>,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }
      ),
  },

  analytics: {
    attendanceRate: (params: Query = {}) =>
      ssrOrFetch<any>(
        `/api/analytics/attendance-rate?${qs(params)}`,
        () => analyticsService.getAttendanceRate(params) as Promise<any>
      ),
  },

  upload: {
    listAttachments: (appointmentId: string) =>
      ssrOrFetch<any>(
        `/api/upload/appointment/${appointmentId}`,
        () => getAttachments(appointmentId) as Promise<any>
      ),
  },
};

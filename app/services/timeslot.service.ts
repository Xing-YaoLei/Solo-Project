import { TimeSlot, type ITimeSlot } from "~/models/TimeSlot";
import { CapacityRule } from "~/models/CapacityRule";
import { cacheGet, cacheSet, cacheDel } from "~/utils/redis";
import { connectDB, isDbMockMode } from "~/utils/db";
import { mockStore, mockId } from "~/utils/mock-store";

export async function getTimeSlots(filters: { date?: string; courseType?: string; teacher?: string }) {
  if (isDbMockMode()) {
    let result = [...mockStore.timeSlots];
    if (filters.date) result = result.filter((s) => s.date === filters.date);
    if (filters.courseType) result = result.filter((s) => s.courseType === filters.courseType);
    if (filters.teacher) result = result.filter((s) => s.teacher === filters.teacher);
    result.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
    return result.map((slot) => ({
      ...slot,
      capacityRuleId: mockStore.capacityRules.find((r) => r._id === slot.capacityRuleId) || slot.capacityRuleId,
    })) as any;
  }
  await connectDB();
  const query: Record<string, unknown> = {};
  if (filters.date) query.date = filters.date;
  if (filters.courseType) query.courseType = filters.courseType;
  if (filters.teacher) query.teacher = filters.teacher;
  return TimeSlot.find(query).populate("capacityRuleId").sort({ date: 1, startTime: 1 });
}

export async function getTimeSlotsByDateRange(startDate: string, endDate: string) {
  if (isDbMockMode()) {
    const result = mockStore.timeSlots.filter((s) => s.date >= startDate && s.date <= endDate);
    result.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
    return result.map((slot) => ({
      ...slot,
      capacityRuleId: mockStore.capacityRules.find((r) => r._id === slot.capacityRuleId) || slot.capacityRuleId,
    })) as any;
  }
  await connectDB();
  return TimeSlot.find({
    date: { $gte: startDate, $lte: endDate },
  })
    .populate("capacityRuleId")
    .sort({ date: 1, startTime: 1 });
}

export async function createTimeSlot(data: Omit<ITimeSlot, "createdAt" | "updatedAt" | "currentBookings" | "status">) {
  if (isDbMockMode()) {
    const { _id, ...restData } = data as any;
    const timeSlot: any = {
      ...restData,
      _id: mockId("slot_"),
      currentBookings: 0,
      status: "available",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockStore.timeSlots.push(timeSlot);
    return timeSlot;
  }
  await connectDB();
  const timeSlot = await TimeSlot.create(data);
  await cacheDel(`timeslot:calendar:*`);
  return timeSlot;
}

export async function getSlotCapacity(slotId: string) {
  if (isDbMockMode()) {
    const slot = mockStore.timeSlots.find((s) => s._id === slotId);
    if (!slot) throw new Response("Not found", { status: 404 });
    const rule = mockStore.capacityRules.find((r) => r._id === slot.capacityRuleId);
    if (!rule) throw new Response("CapacityRule not found", { status: 404 });
    return {
      slotId,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      currentBookings: slot.currentBookings,
      maxCapacity: rule.maxCapacity,
      overbookLimit: rule.overbookLimit,
      reminderThreshold: rule.reminderThreshold,
      remaining: rule.maxCapacity - slot.currentBookings,
      isFull: slot.currentBookings >= rule.maxCapacity,
      isOverbooked: slot.currentBookings >= rule.maxCapacity + rule.overbookLimit,
      needsReminder: (slot.currentBookings / rule.maxCapacity) * 100 >= rule.reminderThreshold,
    };
  }
  await connectDB();
  const cacheKey = `timeslot:${slotId}:capacity`;
  const cached = await cacheGet(cacheKey);
  if (cached) return JSON.parse(cached);

  const slot = await TimeSlot.findById(slotId).populate("capacityRuleId");
  if (!slot) throw new Response("Not found", { status: 404 });
  const rule = slot.capacityRuleId as unknown as { maxCapacity: number; overbookLimit: number; reminderThreshold: number };
  const result = {
    slotId,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    currentBookings: slot.currentBookings,
    maxCapacity: rule.maxCapacity,
    overbookLimit: rule.overbookLimit,
    reminderThreshold: rule.reminderThreshold,
    remaining: rule.maxCapacity - slot.currentBookings,
    isFull: slot.currentBookings >= rule.maxCapacity,
    isOverbooked: slot.currentBookings >= rule.maxCapacity + rule.overbookLimit,
    needsReminder: (slot.currentBookings / rule.maxCapacity) * 100 >= rule.reminderThreshold,
  };
  await cacheSet(cacheKey, JSON.stringify(result), 60);
  return result;
}

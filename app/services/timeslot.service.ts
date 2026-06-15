import { TimeSlot, type ITimeSlot } from "~/models/TimeSlot";
import { CapacityRule } from "~/models/CapacityRule";
import { cacheGet, cacheSet, cacheDel } from "~/utils/redis";
import { connectDB } from "~/utils/db";

export async function getTimeSlots(filters: { date?: string; courseType?: string; teacher?: string }) {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (filters.date) query.date = filters.date;
  if (filters.courseType) query.courseType = filters.courseType;
  if (filters.teacher) query.teacher = filters.teacher;
  return TimeSlot.find(query).populate("capacityRuleId").sort({ date: 1, startTime: 1 });
}

export async function getTimeSlotsByDateRange(startDate: string, endDate: string) {
  await connectDB();
  return TimeSlot.find({
    date: { $gte: startDate, $lte: endDate },
  })
    .populate("capacityRuleId")
    .sort({ date: 1, startTime: 1 });
}

export async function createTimeSlot(data: Omit<ITimeSlot, "createdAt" | "updatedAt" | "currentBookings" | "status">) {
  await connectDB();
  const timeSlot = await TimeSlot.create(data);
  await cacheDel(`timeslot:calendar:*`);
  return timeSlot;
}

export async function getSlotCapacity(slotId: string) {
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

import { Appointment, type IAppointment } from "~/models/Appointment";
import { TimeSlot } from "~/models/TimeSlot";
import { TimelineEvent } from "~/models/TimelineEvent";
import { ConflictRecord } from "~/models/ConflictRecord";
import { CapacityRule } from "~/models/CapacityRule";
import { cacheGet, cacheSet, cacheDel } from "~/utils/redis";
import { connectDB } from "~/utils/db";
import type { Types } from "mongoose";

type WithId<T> = T & { _id: Types.ObjectId };

function objectIdsEqual(a: any, b: any): boolean {
  if (!a || !b) return false;
  const sa = typeof a === "string" ? a : a.toString();
  const sb = typeof b === "string" ? b : b.toString();
  return sa === sb;
}

async function findAffectedAppointments(slotIds: Types.ObjectId[], excludeId?: Types.ObjectId): Promise<Types.ObjectId[]> {
  if (slotIds.length === 0) return [];
  const query: any = { timeSlotId: { $in: slotIds } };
  if (excludeId) query._id = { $ne: excludeId };
  const apts = await Appointment.find(query).select("_id");
  return apts.map((a) => a._id);
}

export async function createAppointment(
  data: Omit<IAppointment, "createdAt" | "updatedAt"> & { handler: string }
) {
  await connectDB();
  const timeSlot = await TimeSlot.findById(data.timeSlotId).populate<{ capacityRuleId: any }>("capacityRuleId");
  if (!timeSlot) throw new Response("TimeSlot not found", { status: 404 });

  const capacityRule = timeSlot.capacityRuleId || await CapacityRule.findById(timeSlot.capacityRuleId);
  if (!capacityRule) throw new Response("CapacityRule not found", { status: 404 });

  const maxAllowed = capacityRule.maxCapacity + capacityRule.overbookLimit;
  const detectedConflicts: {
    type: "overcapacity" | "teacher_conflict" | "classroom_conflict" | "time_overlap";
    description: string;
    affectedTimeSlotIds: Types.ObjectId[];
    affectedAppointmentIds?: Types.ObjectId[];
  }[] = [];

  if (timeSlot.currentBookings >= maxAllowed) {
    const existingApts = await findAffectedAppointments([timeSlot._id] as Types.ObjectId[]);
    detectedConflicts.push({
      type: "overcapacity",
      description: `时段 ${timeSlot.date} ${timeSlot.startTime}-${timeSlot.endTime} 容量已满（${timeSlot.currentBookings}/${maxAllowed}），超售上限 ${capacityRule.overbookLimit}，需协调员决定是否放行或改期`,
      affectedTimeSlotIds: [timeSlot._id] as Types.ObjectId[],
      affectedAppointmentIds: existingApts,
    });
  }

  const teacherOverlaps = await TimeSlot.find({
    _id: { $ne: timeSlot._id },
    date: timeSlot.date,
    teacher: timeSlot.teacher,
    startTime: { $lt: timeSlot.endTime },
    endTime: { $gt: timeSlot.startTime },
  });
  if (teacherOverlaps.length > 0) {
    const slotIds = [timeSlot._id, ...teacherOverlaps.map((s) => s._id)] as Types.ObjectId[];
    const existingApts = await findAffectedAppointments(slotIds);
    detectedConflicts.push({
      type: "teacher_conflict",
      description: `教师【${timeSlot.teacher}】在 ${timeSlot.date} ${timeSlot.startTime}-${timeSlot.endTime} 与 ${teacherOverlaps.map((s) => `${s.startTime}-${s.endTime}`).join("、")} 时段重复排课`,
      affectedTimeSlotIds: slotIds,
      affectedAppointmentIds: existingApts,
    });
  }

  const classroomOverlaps = await TimeSlot.find({
    _id: { $ne: timeSlot._id },
    date: timeSlot.date,
    classroom: timeSlot.classroom,
    startTime: { $lt: timeSlot.endTime },
    endTime: { $gt: timeSlot.startTime },
  });
  if (classroomOverlaps.length > 0) {
    const slotIds = [timeSlot._id, ...classroomOverlaps.map((s) => s._id)] as Types.ObjectId[];
    const existingApts = await findAffectedAppointments(slotIds);
    detectedConflicts.push({
      type: "classroom_conflict",
      description: `教室【${timeSlot.classroom}】在 ${timeSlot.date} ${timeSlot.startTime}-${timeSlot.endTime} 与 ${classroomOverlaps.map((s) => `${s.startTime}-${s.endTime}`).join("、")} 时段冲突`,
      affectedTimeSlotIds: slotIds,
      affectedAppointmentIds: existingApts,
    });
  }

  let conflictId: Types.ObjectId | undefined = undefined;
  let firstConflict: any = null;

  if (detectedConflicts.length > 0) {
    const primary = detectedConflicts[0];
    const allSlotIds = Array.from(
      new Set(detectedConflicts.flatMap((c) => c.affectedTimeSlotIds.map((id) => id.toString())))
    );
    const allAptIds = Array.from(
      new Set(detectedConflicts.flatMap((c) => (c.affectedAppointmentIds || []).map((id) => id.toString())))
    );
    const combinedDesc = detectedConflicts.length === 1
      ? primary.description
      : detectedConflicts.map((c) => c.description).join("；");

    firstConflict = await ConflictRecord.create({
      type: primary.type,
      timeSlotId: timeSlot._id,
      affectedTimeSlotIds: allSlotIds,
      affectedAppointmentIds: allAptIds,
      description: combinedDesc,
      status: "detected",
      assignedRole: "coordinator",
    });
    conflictId = firstConflict._id;
  }

  const appointment = await Appointment.create({
    ...data,
    status: detectedConflicts.length > 0 ? "pending" : "confirmed",
    conflictId,
  });

  if (firstConflict) {
    if (!firstConflict.affectedAppointmentIds.some((id: any) => objectIdsEqual(id, appointment._id))) {
      firstConflict.affectedAppointmentIds.push(appointment._id);
      await firstConflict.save();
    }

    for (const affectedId of firstConflict.affectedAppointmentIds as Types.ObjectId[]) {
      const isCurrent = objectIdsEqual(affectedId, appointment._id);
      await TimelineEvent.create({
        appointmentId: affectedId,
        eventType: "conflict_detected",
        handler: isCurrent ? data.handler : "system",
        handlerRole: isCurrent ? "coordinator" : "system",
        content: `检测到${detectedConflicts.map((c) => ({
          overcapacity: "容量超限",
          teacher_conflict: "教师冲突",
          classroom_conflict: "教室冲突",
          time_overlap: "时段重叠",
        }[c.type])).join("、")}：${firstConflict.description}。已转协调员处理，请确认归属后再继续。`,
        newValue: firstConflict._id.toString(),
      });
    }
  }

  if (detectedConflicts.length === 0) {
    timeSlot.currentBookings += 1;
    if (timeSlot.currentBookings >= capacityRule.maxCapacity) {
      timeSlot.status = "full";
    }
    await timeSlot.save();
  }

  await TimelineEvent.create({
    appointmentId: appointment._id,
    eventType: "created",
    handler: data.handler,
    handlerRole: "coordinator",
    content: `预约创建：${data.studentName}（${data.studentAge}岁）-${data.courseType} ${timeSlot.date} ${timeSlot.startTime}-${timeSlot.endTime} 教师${timeSlot.teacher} ${timeSlot.classroom}`,
  });

  await cacheDel(`timeslot:${data.timeSlotId}:capacity`);
  await cacheDel(`reminders:pending`);

  return { appointment, conflict: firstConflict };
}

export async function getAppointments(filters: {
  status?: string;
  date?: string;
  courseType?: string;
  page?: number;
  limit?: number;
}) {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (filters.status) query.status = filters.status;
  if (filters.courseType) query.courseType = filters.courseType;
  if (filters.date) {
    const slots = await TimeSlot.find({ date: filters.date }).select("_id");
    query.timeSlotId = { $in: slots.map((s) => s._id) };
  }
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const [appointments, total] = await Promise.all([
    Appointment.find(query)
      .populate("timeSlotId")
      .populate("conflictId")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Appointment.countDocuments(query),
  ]);
  return { appointments, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getAppointmentById(id: string) {
  await connectDB();
  const appointment = await Appointment.findById(id)
    .populate("timeSlotId")
    .populate("conflictId");
  if (!appointment) throw new Response("Not found", { status: 404 });
  const timeline = await TimelineEvent.find({ appointmentId: id }).sort({ createdAt: 1 });
  return { appointment, timeline };
}

export async function updateAppointmentStatus(
  id: string,
  status: IAppointment["status"],
  handler: string,
  remark?: string
) {
  await connectDB();
  const appointment = await Appointment.findById(id);
  if (!appointment) throw new Response("Not found", { status: 404 });
  const previous = appointment.status;
  appointment.status = status;
  if (remark) appointment.remark = remark;
  await appointment.save();

  await TimelineEvent.create({
    appointmentId: id,
    eventType: "status_changed",
    handler,
    handlerRole: "coordinator",
    previousValue: previous,
    newValue: status,
    content: remark,
  });

  if (status === "cancelled" || status === "no_show") {
    const timeSlot = await TimeSlot.findById(appointment.timeSlotId);
    if (timeSlot) {
      timeSlot.currentBookings = Math.max(0, timeSlot.currentBookings - 1);
      if (timeSlot.status === "full") {
        const rule = await CapacityRule.findById(timeSlot.capacityRuleId);
        if (rule && timeSlot.currentBookings < rule.maxCapacity) {
          timeSlot.status = "available";
        }
      }
      await timeSlot.save();
      await cacheDel(`timeslot:${timeSlot._id}:capacity`);
    }
  }

  await cacheDel(`reminders:pending`);
  return appointment;
}

export async function addRemark(id: string, handler: string, content: string) {
  await connectDB();
  await TimelineEvent.create({
    appointmentId: id,
    eventType: "remark_added",
    handler,
    handlerRole: "coordinator",
    content,
  });
}

import { Appointment, type IAppointment } from "~/models/Appointment";
import { TimeSlot } from "~/models/TimeSlot";
import { TimelineEvent } from "~/models/TimelineEvent";
import { ConflictRecord } from "~/models/ConflictRecord";
import { CapacityRule } from "~/models/CapacityRule";
import { cacheGet, cacheSet, cacheDel } from "~/utils/redis";
import { connectDB } from "~/utils/db";

export async function createAppointment(
  data: Omit<IAppointment, "createdAt" | "updatedAt"> & { handler: string }
) {
  await connectDB();
  const timeSlot = await TimeSlot.findById(data.timeSlotId);
  if (!timeSlot) throw new Response("TimeSlot not found", { status: 404 });

  const capacityRule = await CapacityRule.findById(timeSlot.capacityRuleId);
  if (!capacityRule) throw new Response("CapacityRule not found", { status: 404 });

  const maxAllowed = capacityRule.maxCapacity + capacityRule.overbookLimit;
  if (timeSlot.currentBookings >= maxAllowed) {
    const conflict = await ConflictRecord.create({
      type: "overcapacity",
      timeSlotId: data.timeSlotId,
      affectedAppointmentIds: [],
      affectedTimeSlotIds: [data.timeSlotId],
      description: `时段 ${timeSlot.date} ${timeSlot.startTime}-${timeSlot.endTime} 已达容量上限 ${maxAllowed}`,
      status: "detected",
      assignedRole: "coordinator",
    });
    const appointment = await Appointment.create({
      ...data,
      status: "pending",
      conflictId: conflict._id,
    });
    await TimelineEvent.create({
      appointmentId: appointment._id,
      eventType: "conflict_detected",
      handler: data.handler,
      handlerRole: "system",
      content: `容量冲突：已达上限 ${maxAllowed}，已转协调员处理`,
      newValue: conflict._id.toString(),
    });
    await cacheDel(`timeslot:${data.timeSlotId}:capacity`);
    return { appointment, conflict };
  }

  const overlapping = await TimeSlot.find({
    _id: { $ne: data.timeSlotId },
    date: timeSlot.date,
    teacher: timeSlot.teacher,
    startTime: { $lt: timeSlot.endTime },
    endTime: { $gt: timeSlot.startTime },
  });

  let conflictId = undefined;
  if (overlapping.length > 0) {
    const conflict = await ConflictRecord.create({
      type: "teacher_conflict",
      timeSlotId: data.timeSlotId,
      affectedAppointmentIds: [],
      affectedTimeSlotIds: overlapping.map((s) => s._id),
      description: `教师 ${timeSlot.teacher} 在 ${timeSlot.date} 时段存在冲突`,
      status: "detected",
      assignedRole: "coordinator",
    });
    conflictId = conflict._id;
  }

  const appointment = await Appointment.create({
    ...data,
    status: "confirmed",
    conflictId,
  });

  timeSlot.currentBookings += 1;
  if (timeSlot.currentBookings >= capacityRule.maxCapacity) {
    timeSlot.status = "full";
  }
  await timeSlot.save();

  await TimelineEvent.create({
    appointmentId: appointment._id,
    eventType: "created",
    handler: data.handler,
    handlerRole: "coordinator",
    content: `预约创建：${data.studentName} - ${data.courseType}`,
  });

  await cacheDel(`timeslot:${data.timeSlotId}:capacity`);
  await cacheDel(`reminders:pending`);

  return { appointment, conflict: null };
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

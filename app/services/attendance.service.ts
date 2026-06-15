import { Attendance, type IAttendance } from "~/models/Attendance";
import { Appointment } from "~/models/Appointment";
import { TimelineEvent } from "~/models/TimelineEvent";
import { cacheDel } from "~/utils/redis";
import { connectDB } from "~/utils/db";

export async function checkIn(data: { appointmentId: string; timeSlotId: string; status: IAttendance["status"]; checkedInBy: string; remark?: string }) {
  await connectDB();
  const attendance = await Attendance.create({
    ...data,
    checkedInAt: new Date(),
  });
  await Appointment.findByIdAndUpdate(data.appointmentId, {
    status: data.status === "present" || data.status === "late" ? "checked_in" : "no_show",
  });
  await TimelineEvent.create({
    appointmentId: data.appointmentId,
    eventType: "status_changed",
    handler: data.checkedInBy,
    handlerRole: "coordinator",
    previousValue: "confirmed",
    newValue: data.status === "present" || data.status === "late" ? "checked_in" : "no_show",
    content: `到场签到：${data.status}${data.remark ? ` - ${data.remark}` : ""}`,
  });
  await cacheDel(`attendance:*`);
  await cacheDel(`reminders:pending`);
  return attendance;
}

export async function getAttendanceBySlot(timeSlotId: string) {
  await connectDB();
  return Attendance.find({ timeSlotId }).populate("appointmentId");
}

export async function getAttendanceRate(filters: { startDate?: string; endDate?: string; courseType?: string }) {
  await connectDB();
  const matchStage: Record<string, unknown> = {};
  if (filters.startDate || filters.endDate) {
    const dateFilter: Record<string, string> = {};
    if (filters.startDate) dateFilter.$gte = filters.startDate;
    if (filters.endDate) dateFilter.$lte = filters.endDate;
    matchStage["slot.date"] = dateFilter;
  }
  if (filters.courseType) matchStage["slot.courseType"] = filters.courseType;

  const pipeline: any[] = [
    {
      $lookup: {
        from: "timeslots",
        localField: "timeSlotId",
        foreignField: "_id",
        as: "slot",
      },
    },
    { $unwind: "$slot" },
  ];
  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }
  pipeline.push(
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: null,
        statuses: { $push: { status: "$_id", count: "$count" } },
        total: { $sum: "$count" },
      },
    }
  );

  const result = await Attendance.aggregate(pipeline);
  if (result.length === 0) {
    return { total: 0, present: 0, absent: 0, late: 0, excused: 0, rate: 0 };
  }
  const statuses = result[0].statuses as { status: string; count: number }[];
  const total = result[0].total as number;
  const present = statuses.find((s) => s.status === "present")?.count || 0;
  const absent = statuses.find((s) => s.status === "absent")?.count || 0;
  const late = statuses.find((s) => s.status === "late")?.count || 0;
  const excused = statuses.find((s) => s.status === "excused")?.count || 0;
  return {
    total,
    present,
    absent,
    late,
    excused,
    rate: total > 0 ? Math.round(((present + late) / total) * 10000) / 100 : 0,
  };
}

export async function getReminderList() {
  await connectDB();
  const appointments = await Appointment.find({
    status: { $in: ["pending", "confirmed"] },
  })
    .populate("timeSlotId")
    .sort({ createdAt: 1 });
  const reminders = appointments.filter((apt) => {
    const slot = apt.timeSlotId as unknown as { date: string; startTime: string };
    if (!slot) return false;
    const slotTime = new Date(`${slot.date}T${slot.startTime}`);
    const now = new Date();
    const diffHours = (slotTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 24;
  });
  return reminders;
}

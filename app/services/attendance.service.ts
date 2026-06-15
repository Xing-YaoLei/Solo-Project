import { Attendance, type IAttendance } from "~/models/Attendance";
import { Appointment } from "~/models/Appointment";
import { TimelineEvent } from "~/models/TimelineEvent";
import { cacheDel } from "~/utils/redis";
import { connectDB, isDbMockMode } from "~/utils/db";
import { mockStore, mockId, addTimeline } from "~/utils/mock-store";

export async function checkIn(data: { appointmentId: string; timeSlotId: string; status: IAttendance["status"]; checkedInBy: string; remark?: string }) {
  if (isDbMockMode()) {
    const attendance: any = {
      _id: mockId("att_"),
      appointmentId: data.appointmentId,
      timeSlotId: data.timeSlotId,
      status: data.status,
      checkedInAt: new Date(),
      checkedInBy: data.checkedInBy,
      remark: data.remark,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockStore.attendance.push(attendance);

    const apt = mockStore.appointments.find((a) => a._id === data.appointmentId);
    if (apt) {
      const newStatus = data.status === "present" || data.status === "late" ? "checked_in" : "no_show";
      (apt.status as any) = newStatus;
      (apt.updatedAt as Date) = new Date();
    }

    addTimeline({
      appointmentId: data.appointmentId,
      eventType: "status_changed",
      handler: data.checkedInBy,
      handlerRole: "coordinator",
      previousValue: "confirmed",
      newValue: data.status === "present" || data.status === "late" ? "checked_in" : "no_show",
      content: `到场签到：${data.status}${data.remark ? ` - ${data.remark}` : ""}`,
    });

    return attendance;
  }
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
  if (isDbMockMode()) {
    const result = mockStore.attendance.filter((a) => a.timeSlotId === timeSlotId);
    return result.map((att) => ({
      ...att,
      appointmentId: mockStore.appointments.find((a) => a._id === att.appointmentId) || att.appointmentId,
    })) as any;
  }
  await connectDB();
  return Attendance.find({ timeSlotId }).populate("appointmentId");
}

export async function getAttendanceRate(filters: { startDate?: string; endDate?: string; courseType?: string }) {
  if (isDbMockMode()) {
    let attendances = [...mockStore.attendance];
    if (filters.startDate || filters.endDate || filters.courseType) {
      attendances = attendances.filter((att) => {
        const slot = mockStore.timeSlots.find((s) => s._id === att.timeSlotId);
        if (!slot) return false;
        if (filters.startDate && slot.date < filters.startDate) return false;
        if (filters.endDate && slot.date > filters.endDate) return false;
        if (filters.courseType && slot.courseType !== filters.courseType) return false;
        return true;
      });
    }
    const total = attendances.length;
    const present = attendances.filter((a) => a.status === "present").length;
    const absent = attendances.filter((a) => a.status === "absent").length;
    const late = attendances.filter((a) => a.status === "late").length;
    const excused = attendances.filter((a) => a.status === "excused").length;
    return {
      total,
      present,
      absent,
      late,
      excused,
      rate: total > 0 ? Math.round(((present + late) / total) * 10000) / 100 : 0,
    };
  }
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
  if (isDbMockMode()) {
    const appointments = mockStore.appointments.filter((a) =>
      a.status === "pending" || a.status === "confirmed"
    );
    const reminders = appointments.filter((apt) => {
      const slot = mockStore.timeSlots.find((s) => s._id === apt.timeSlotId);
      if (!slot) return false;
      const slotTime = new Date(`${slot.date}T${slot.startTime}`);
      const now = new Date();
      const diffHours = (slotTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      return diffHours > 0 && diffHours <= 24;
    });
    return reminders
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((apt) => {
        const slot = mockStore.timeSlots.find((s) => s._id === apt.timeSlotId);
        return { ...apt, timeSlotId: slot || apt.timeSlotId };
      }) as any;
  }
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

import { Router } from "express";
import { getAttendanceRate } from "../services/attendance.service.js";
import { getAppointments } from "../services/appointment.service.js";
import { exportToXlsx } from "../utils/export.js";
import { getConflicts } from "../services/conflict.service.js";
import { getTimeSlots } from "../services/timeslot.service.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const startDate = typeof req.query.startDate === "string" ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === "string" ? req.query.endDate : undefined;
    const courseType = typeof req.query.courseType === "string" ? req.query.courseType : undefined;
    const [rate, conflicts, slots, apts] = await Promise.all([
      getAttendanceRate({ startDate, endDate, courseType }),
      getConflicts({}),
      getTimeSlots({}),
      getAppointments({ limit: 0 }),
    ]);
    res.json({
      ok: true,
      summary: {
        attendanceRate: rate.rate,
        totalAppointments: apts.total,
        totalSlots: Array.isArray(slots) ? slots.length : 0,
        pendingConflicts: Array.isArray(conflicts) ? conflicts.filter((c: any) => c.status !== "resolved").length : 0,
        totalConflicts: Array.isArray(conflicts) ? conflicts.length : 0,
        breakdown: {
          present: rate.present,
          absent: rate.absent,
          late: rate.late,
          excused: rate.excused,
          total: rate.total,
        },
      },
      endpoints: {
        "GET /attendance-rate": "/api/analytics/attendance-rate",
        "GET /export": "/api/analytics/export",
      },
    });
  } catch (e) { next(e); }
});

router.get("/attendance-rate", async (req, res, next) => {
  try {
    const result = await getAttendanceRate(req.query as any);
    res.json(result);
  } catch (e) { next(e); }
});

router.get("/export", async (req, res, next) => {
  try {
    const { appointments } = await getAppointments(req.query as any);
    const data = appointments.map((a: any) => ({
      学员姓名: a.studentName,
      年龄: a.studentAge,
      监护人: a.guardianName,
      联系电话: a.guardianPhone,
      课程类型: a.courseType,
      状态: a.status,
      来源: a.source,
      创建时间: a.createdAt,
    }));
    const buffer = exportToXlsx(data, "预约记录");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=appointments.xlsx");
    res.send(buffer);
  } catch (e) { next(e); }
});

export default router;

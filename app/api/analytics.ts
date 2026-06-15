import { Router } from "express";
import { getAttendanceRate } from "../services/attendance.service.js";
import { getAppointments } from "../services/appointment.service.js";
import { exportToXlsx } from "../utils/export.js";

const router = Router();

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

import { Router } from "express";
import { checkIn, getAttendanceBySlot, getReminderList, getAttendanceRate } from "../services/attendance.service.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const startDate = typeof req.query.startDate === "string" ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === "string" ? req.query.endDate : undefined;
    const courseType = typeof req.query.courseType === "string" ? req.query.courseType : undefined;
    const [reminder, rate] = await Promise.all([
      getReminderList(),
      getAttendanceRate({ startDate, endDate, courseType }),
    ]);
    res.json({
      ok: true,
      summary: {
        reminderCount: reminder.length,
        attendanceRate: rate.rate,
        total: rate.total,
        present: rate.present,
        absent: rate.absent,
        late: rate.late,
        excused: rate.excused,
      },
      endpoints: {
        "GET /reminder": "/api/attendance/reminder",
        "GET /slot/:slotId": "/api/attendance/slot/:slotId",
        "POST /checkin": "/api/attendance/checkin",
      },
    });
  } catch (e) { next(e); }
});

router.get("/reminder", async (req, res, next) => {
  try {
    const result = await getReminderList();
    res.json(result);
  } catch (e) { next(e); }
});

router.get("/slot/:slotId", async (req, res, next) => {
  try {
    const result = await getAttendanceBySlot(req.params.slotId);
    res.json(result);
  } catch (e) { next(e); }
});

router.post("/checkin", async (req, res, next) => {
  try {
    const result = await checkIn(req.body);
    res.status(201).json(result);
  } catch (e) { next(e); }
});

export default router;

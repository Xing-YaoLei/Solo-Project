import { Router } from "express";
import { checkIn, getAttendanceBySlot, getReminderList } from "../services/attendance.service.js";

const router = Router();

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

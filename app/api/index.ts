import { Router } from "express";
import appointmentsRouter from "./appointments.js";
import timeslotsRouter from "./timeslots.js";
import capacityRouter from "./capacity.js";
import conflictsRouter from "./conflicts.js";
import attendanceRouter from "./attendance.js";
import analyticsRouter from "./analytics.js";
import uploadRouter from "./upload.js";

const router = Router();

router.use("/appointments", appointmentsRouter);
router.use("/timeslots", timeslotsRouter);
router.use("/capacity", capacityRouter);
router.use("/conflicts", conflictsRouter);
router.use("/attendance", attendanceRouter);
router.use("/analytics", analyticsRouter);
router.use("/upload", uploadRouter);

export { router as apiRouter };
export default router;

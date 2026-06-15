import { Router } from "express";
import { createAppointment, getAppointments, getAppointmentById, updateAppointmentStatus, addRemark } from "../services/appointment.service.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const result = await getAppointments(req.query as any);
    res.json(result);
  } catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const result = await getAppointmentById(req.params.id);
    res.json(result);
  } catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  try {
    const result = await createAppointment(req.body);
    res.status(201).json(result);
  } catch (e) { next(e); }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    const { status, handler, remark } = req.body;
    const result = await updateAppointmentStatus(req.params.id, status, handler, remark);
    res.json(result);
  } catch (e) { next(e); }
});

router.post("/:id/remark", async (req, res, next) => {
  try {
    const { handler, content } = req.body;
    await addRemark(req.params.id, handler, content);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;

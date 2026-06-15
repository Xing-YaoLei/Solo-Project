import { Router } from "express";
import { getTimeSlots, getTimeSlotsByDateRange, createTimeSlot, getSlotCapacity } from "../services/timeslot.service.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const result = await getTimeSlots(req.query as any);
    res.json(result);
  } catch (e) { next(e); }
});

router.get("/range", async (req, res, next) => {
  try {
    const { start, end } = req.query as any;
    const result = await getTimeSlotsByDateRange(start, end);
    res.json(result);
  } catch (e) { next(e); }
});

router.get("/:id/capacity", async (req, res, next) => {
  try {
    const result = await getSlotCapacity(req.params.id);
    res.json(result);
  } catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  try {
    const result = await createTimeSlot(req.body);
    res.status(201).json(result);
  } catch (e) { next(e); }
});

export default router;

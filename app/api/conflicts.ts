import { Router } from "express";
import { getConflicts, forwardConflict, supplementConflict, resolveConflict } from "../services/conflict.service.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const result = await getConflicts(req.query as any);
    res.json(result);
  } catch (e) { next(e); }
});

router.post("/:id/forward", async (req, res, next) => {
  try {
    const { assignedTo, assignedRole } = req.body;
    const result = await forwardConflict(req.params.id, assignedTo, assignedRole);
    res.json(result);
  } catch (e) { next(e); }
});

router.post("/:id/supplement", async (req, res, next) => {
  try {
    const { supplementNote, handler } = req.body;
    const result = await supplementConflict(req.params.id, supplementNote, handler);
    res.json(result);
  } catch (e) { next(e); }
});

router.post("/:id/resolve", async (req, res, next) => {
  try {
    const { resolvedBy } = req.body;
    const result = await resolveConflict(req.params.id, resolvedBy);
    res.json(result);
  } catch (e) { next(e); }
});

export default router;

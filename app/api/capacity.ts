import { Router } from "express";
import { getCapacityRules, getCapacityRuleByCourseType, createCapacityRule, updateCapacityRule } from "../services/capacity.service.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const result = await getCapacityRules();
    res.json(result);
  } catch (e) { next(e); }
});

router.get("/:courseType", async (req, res, next) => {
  try {
    const result = await getCapacityRuleByCourseType(req.params.courseType);
    res.json(result);
  } catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  try {
    const result = await createCapacityRule(req.body);
    res.status(201).json(result);
  } catch (e) { next(e); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const result = await updateCapacityRule(req.params.id, req.body);
    res.json(result);
  } catch (e) { next(e); }
});

export default router;

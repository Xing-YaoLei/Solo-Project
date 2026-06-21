import { Router } from "express";
import {
  listLogs,
  getLog,
  closeLog,
} from "../controllers/logs.controller.js";

const router = Router();

router.get("/", listLogs);
router.get("/:id", getLog);
router.put("/:id/close", closeLog);

export default router;

import { Router } from "express";
import {
  listFinanceData,
  getFinanceData,
  createFinanceData,
  updateFinanceData,
  getFinanceChangeLogs,
} from "../controllers/finance.controller.js";

const router = Router();

router.get("/", listFinanceData);
router.get("/:carId", getFinanceData);
router.get("/:carId/changes", getFinanceChangeLogs);
router.post("/", createFinanceData);
router.put("/:carId", updateFinanceData);

export default router;

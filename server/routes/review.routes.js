import { Router } from "express";
import {
  getInventoryTurnoverStats,
  getMonthlyReview,
  syncInventoryTurnover,
  getCarTurnoverDetail,
} from "../controllers/review.controller.js";

const router = Router();

router.get("/inventory-turnover", getInventoryTurnoverStats);
router.get("/monthly", getMonthlyReview);
router.get("/car/:carId", getCarTurnoverDetail);
router.post("/sync", syncInventoryTurnover);

export default router;

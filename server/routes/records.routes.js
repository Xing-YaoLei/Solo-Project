import { Router } from "express";
import {
  getCarRecords,
  listPreparationLists,
  createPreparationList,
  updatePreparationList,
  listTestDriveRecords,
  createTestDriveRecord,
  updateTestDriveRecord,
  listQuoteHistories,
  createQuoteHistory,
  updateQuoteHistory,
} from "../controllers/records.controller.js";

const router = Router();

router.get("/car/:carId", getCarRecords);

router.get("/preparations", listPreparationLists);
router.post("/preparations", createPreparationList);
router.put("/preparations/:id", updatePreparationList);

router.get("/test-drives", listTestDriveRecords);
router.post("/test-drives", createTestDriveRecord);
router.put("/test-drives/:id", updateTestDriveRecord);

router.get("/quotes", listQuoteHistories);
router.post("/quotes", createQuoteHistory);
router.put("/quotes/:id", updateQuoteHistory);

export default router;

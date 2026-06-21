import { Router } from "express";
import {
  exportInventoryTurnover,
  exportTransferMaterials,
  exportFinanceData,
  exportOperationLogs,
  listExportRecords,
  downloadExport,
} from "../controllers/export.controller.js";

const router = Router();

router.get("/records", listExportRecords);
router.get("/download/:id", downloadExport);
router.post("/inventory-turnover", exportInventoryTurnover);
router.post("/transfer-materials", exportTransferMaterials);
router.post("/finance-data", exportFinanceData);
router.post("/operation-logs", exportOperationLogs);

export default router;

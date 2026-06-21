import { Router } from "express";
import carRoutes from "./car.routes.js";
import recordsRoutes from "./records.routes.js";
import financeRoutes from "./finance.routes.js";
import transferMaterialRoutes from "./transferMaterial.routes.js";
import reviewRoutes from "./review.routes.js";
import notificationRoutes from "./notification.routes.js";
import logsRoutes from "./logs.routes.js";
import exportRoutes from "./export.routes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", message: "API is running" });
});

router.use("/cars", carRoutes);
router.use("/records", recordsRoutes);
router.use("/finance", financeRoutes);
router.use("/transfer-materials", transferMaterialRoutes);
router.use("/review", reviewRoutes);
router.use("/notifications", notificationRoutes);
router.use("/logs", logsRoutes);
router.use("/export", exportRoutes);

export default router;

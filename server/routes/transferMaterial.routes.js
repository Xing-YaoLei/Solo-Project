import { Router } from "express";
import {
  listTransferMaterials,
  getTransferMaterial,
  createTransferMaterial,
  updateTransferMaterial,
  updateMaterialItem,
  checkMissingMaterials,
} from "../controllers/transferMaterial.controller.js";

const router = Router();

router.get("/", listTransferMaterials);
router.get("/:carId", getTransferMaterial);
router.post("/", createTransferMaterial);
router.put("/:carId", updateTransferMaterial);
router.put("/:carId/items/:itemIndex", updateMaterialItem);
router.post("/:carId/check-missing", checkMissingMaterials);

export default router;

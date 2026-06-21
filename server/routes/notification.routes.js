import { Router } from "express";
import {
  listNotifications,
  getNotification,
  markAsRead,
  resolveNotification,
  createNotification,
} from "../controllers/notification.controller.js";

const router = Router();

router.get("/", listNotifications);
router.get("/:id", getNotification);
router.post("/", createNotification);
router.put("/:id/read", markAsRead);
router.put("/:id/resolve", resolveNotification);

export default router;

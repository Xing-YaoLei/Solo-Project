import { Router } from "express";
import { upload, saveAttachmentRecord, getAttachments } from "../services/upload.service.js";

const router = Router();

router.post("/appointment/:id", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "未选择文件" });
      return;
    }
    const { handler, handlerRole } = req.body;
    const appointmentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await saveAttachmentRecord(
      appointmentId,
      handler || "system",
      handlerRole || "coordinator",
      req.file.filename,
      req.file.originalname
    );
    res.status(201).json({
      ok: true,
      url: `/uploads/${req.file.filename}`,
      name: req.file.originalname,
    });
  } catch (e) { next(e); }
});

router.get("/appointment/:id", async (req, res, next) => {
  try {
    const result = await getAttachments(req.params.id);
    res.json(result);
  } catch (e) { next(e); }
});

export default router;

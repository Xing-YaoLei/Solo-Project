import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { TimelineEvent } from "~/models/TimelineEvent";
import { connectDB } from "~/utils/db";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("只支持图片、PDF和Office文档"));
  },
});

export async function saveAttachmentRecord(
  appointmentId: string,
  handler: string,
  handlerRole: "admin" | "coordinator" | "teacher" | "system",
  filename: string,
  originalName: string
) {
  await connectDB();
  await TimelineEvent.create({
    appointmentId,
    eventType: "attachment_added",
    handler,
    handlerRole,
    attachmentUrl: `/uploads/${filename}`,
    attachmentName: originalName,
    content: `上传附件：${originalName}`,
  });
}

export async function getAttachments(appointmentId: string) {
  await connectDB();
  const events = await TimelineEvent.find({
    appointmentId,
    eventType: "attachment_added",
  }).sort({ createdAt: -1 });
  return events.map((e) => ({
    url: e.attachmentUrl,
    name: e.attachmentName,
    uploadedBy: e.handler,
    uploadedAt: e.createdAt,
  }));
}

import { Router, Request, Response } from "express";
import { z } from "zod";
import { User } from "~/models/user";
import { createSession, destroySession, requireUser, AuthRequest } from "~/middleware/auth";
import { connectToMongo } from "~/lib/db";

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(1, "用户名不能为空"),
  password: z.string().min(6, "密码至少6位"),
});

const registerSchema = z.object({
  username: z.string().min(3, "用户名至少3位"),
  password: z.string().min(6, "密码至少6位"),
  name: z.string().min(1, "姓名不能为空"),
  role: z.enum(["manager", "executive"]).default("executive"),
  phone: z.string().optional(),
});

authRouter.post("/login", async (req: Request, res: Response) => {
  await connectToMongo();

  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      error: validation.error.errors.map((e) => e.message).join(", "),
    });
    return;
  }

  const { username, password } = validation.data;
  const user = await User.findByCredentials(username, password);

  if (!user) {
    res.status(401).json({ error: "用户名或密码错误" });
    return;
  }

  user.lastLoginAt = new Date();
  await user.save();

  await createSession(user._id.toString(), req);

  res.json({
    user: user.toJSON(),
  });
});

authRouter.post("/register", async (req: Request, res: Response) => {
  await connectToMongo();

  const validation = registerSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      error: validation.error.errors.map((e) => e.message).join(", "),
    });
    return;
  }

  const existingUser = await User.findOne({ username: validation.data.username });
  if (existingUser) {
    res.status(400).json({ error: "用户名已存在" });
    return;
  }

  const user = new User(validation.data);
  await user.save();

  res.status(201).json({
    user: user.toJSON(),
  });
});

authRouter.post("/logout", async (req: Request, res: Response) => {
  await destroySession(req);
  res.json({ message: "已退出登录" });
});

authRouter.get("/me", requireUser, async (req: AuthRequest, res: Response) => {
  res.json({
    user: req.user?.toJSON(),
  });
});

authRouter.post("/init", async (req: Request, res: Response) => {
  await connectToMongo();

  const existingAdmin = await User.findOne({ username: "admin" });
  if (existingAdmin) {
    res.status(400).json({ error: "初始化已完成" });
    return;
  }

  const admin = new User({
    username: "admin",
    password: "admin123",
    name: "系统管理员",
    role: "manager",
    phone: "13800138000",
  });
  await admin.save();

  const executive = new User({
    username: "executive",
    password: "exec123",
    name: "执行员",
    role: "executive",
    phone: "13800138001",
  });
  await executive.save();

  res.json({
    message: "初始化完成，默认账号已创建",
    accounts: [
      { username: "admin", password: "admin123", role: "manager" },
      { username: "executive", password: "exec123", role: "executive" },
    ],
  });
});

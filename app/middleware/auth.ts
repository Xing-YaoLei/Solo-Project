import { Request, Response, NextFunction } from "express";
import { User, UserDocument } from "~/models/user";
import { Types } from "mongoose";

export interface AuthRequest extends Request {
  user?: UserDocument;
}

export async function requireUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const userId = req.session.userId;

  if (!userId) {
    res.status(401).json({ error: "未登录，请先登录" });
    return;
  }

  try {
    const user = await User.findById(new Types.ObjectId(userId));
    if (!user || !user.isActive) {
      req.session.destroy(() => {});
      res.status(401).json({ error: "账号不存在或已禁用" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: "认证失败" });
  }
}

export async function requireManager(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  await requireUser(req, res, () => {
    if (req.user?.role !== "manager") {
      res.status(403).json({ error: "需要管理员权限" });
      return;
    }
    next();
  });
}

export function createSession(userId: string, req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.userId = userId;
    req.session.save((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function destroySession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

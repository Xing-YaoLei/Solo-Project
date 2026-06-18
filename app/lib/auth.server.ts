import { User, UserDocument } from "~/models/user";
import { connectToMongo, isMongoConnected } from "~/lib/db";
import { Types } from "mongoose";

export interface SessionData {
  userId?: string;
}

export interface AuthContext {
  session?: {
    userId?: string;
    destroy: (callback?: (err: any) => void) => void;
    save: (callback?: (err: any) => void) => void;
  };
  user?: UserDocument;
}

export async function getUserFromSession(
  context: AuthContext
): Promise<UserDocument | null> {
  if (context.user) {
    return context.user;
  }

  if (!context.session?.userId) {
    return null;
  }

  const connected = await connectToMongo();
  if (!connected) {
    return null;
  }

  try {
    const user = await User.findById(
      new Types.ObjectId(context.session.userId)
    );
    if (!user || !user.isActive) {
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export async function requireUser(context: AuthContext): Promise<UserDocument> {
  const user = await getUserFromSession(context);
  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return user;
}

export async function requireManager(context: AuthContext): Promise<UserDocument> {
  const user = await requireUser(context);
  if (user.role !== "manager") {
    throw new Response("Forbidden", { status: 403 });
  }
  return user;
}

export async function login(
  username: string,
  password: string,
  context: AuthContext
): Promise<UserDocument> {
  const connected = await connectToMongo();
  if (!connected) {
    throw new Error("数据库连接失败，请稍后重试");
  }

  const user = await User.findByCredentials(username, password);
  if (!user) {
    throw new Error("用户名或密码错误");
  }

  user.lastLoginAt = new Date();
  await user.save();

  if (context.session) {
    context.session.userId = user._id.toString();
    await new Promise<void>((resolve, reject) => {
      context.session!.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  return user;
}

export async function logout(context: AuthContext): Promise<void> {
  if (context.session) {
    await new Promise<void>((resolve, reject) => {
      context.session!.destroy((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

export async function createDefaultUsers(): Promise<void> {
  const connected = await connectToMongo();
  if (!connected) {
    console.warn("⚠️  数据库未连接，跳过创建默认用户");
    return;
  }

  const existingAdmin = await User.findOne({ username: "admin" });
  if (existingAdmin) {
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

  console.log("✅ 默认账号已创建");
}

import mongoose from "mongoose";

let isConnected = false;
let isMockMode = false;

export function isDbMockMode(): boolean {
  return isMockMode;
}

export async function connectDB() {
  if (isConnected) return;
  if (isMockMode) return;
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/youth_trial_booking";
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    isConnected = true;
    console.log("✅ MongoDB 已连接");
  } catch (err) {
    isMockMode = true;
    console.log("⚠️  MongoDB 连接失败，已自动切换到内存 Mock 模式");
    console.log("   所有数据操作将使用内存模拟存储，重启后数据会重置");
  }
}

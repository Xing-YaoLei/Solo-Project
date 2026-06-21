import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/used-car-transfer";
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB 已连接: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB 连接失败:", error);
    process.exit(1);
  }
};

export default connectDB;

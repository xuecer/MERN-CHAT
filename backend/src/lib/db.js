import mongoose from "mongoose";
import dns from "dns";

// 设置DNS服务器
dns.setServers(["8.8.8.8", "8.8.4.4"]);
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB 连接错误: ${error.message}`);
    process.exit(1);
  }
};

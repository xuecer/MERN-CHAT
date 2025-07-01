import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected: ", `${mongoose.connection.host}`);
  } catch (error) {
    console.log("MongoDB connection error: ", error);
  }
};

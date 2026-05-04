import mongoose from "mongoose";

const connectDB = async (url) => {
  try {
    mongoose.set("strictQuery", true);

    const conn = await mongoose.connect(url, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export const stopDB = async () => {
  await mongoose.disconnect();
};

export default connectDB;

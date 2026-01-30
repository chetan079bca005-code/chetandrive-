import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer = null;

const connectDB = async (url) => {
  try {
    mongoose.set('strictQuery', true);
    
    let connectionUrl = url;
    
    // Try to connect to the provided URL first
    try {
      const conn = await mongoose.connect(connectionUrl, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (initialError) {
      console.log(`⚠️ Could not connect to ${url}`);
      console.log('🔄 Starting MongoDB Memory Server for development...');
      
      // Fallback to in-memory MongoDB
      mongoServer = await MongoMemoryServer.create();
      connectionUrl = mongoServer.getUri();
      
      const conn = await mongoose.connect(connectionUrl, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log(`✅ MongoDB Memory Server Connected: ${conn.connection.host}`);
      console.log('⚠️ Note: Data will NOT persist after server restart!');
      return conn;
    }
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export const stopDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

export default connectDB;

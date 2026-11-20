import mongoose from "mongoose";
import { env, isProduction } from "./env";

mongoose.set("strictQuery", true);

export async function connectDB() {
  if (!env.MONGODB_URI) {
    if (isProduction) {
      throw new Error("MONGODB_URI is required in production");
    }

    console.warn(
      "MONGODB_URI is not set. Skipping MongoDB connection. Database routes will not work until it is configured.",
    );
    return;
  }

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10_000,
  });

  console.log("MongoDB connected");
}

export async function disconnectDB() {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
  console.log("MongoDB disconnected");
}

import mongoose from "mongoose";
import { ENV } from "./env";
import logger from "../utils/logger";

export const connectDB = async () => {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    logger.info("MongoDB connected successfully");
  } catch (err) {
    logger.error({ err }, "Failed to connect to MongoDB");
    process.exit(1);
  }
};

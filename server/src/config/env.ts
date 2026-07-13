import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGO_URI: process.env.MONGO_URI || "",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "",
  ACCESS_TOKEN_EXPIRES_IN_MINUTES:
    Number(process.env.ACCESS_TOKEN_EXPIRES_IN_MINUTES) || 15,
  REFRESH_TOKEN_EXPIRES_IN_DAYS:
    Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS) || 7,

  ZEVA_AUTH_INTERNAL_URL: process.env.ZEVA_AUTH_INTERNAL_URL || "",
  ZEVA_INTERNAL_API_KEY: process.env.ZEVA_INTERNAL_API_KEY || "",
};

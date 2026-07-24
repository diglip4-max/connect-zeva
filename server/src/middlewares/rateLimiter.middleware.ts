import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

// Common handler - consistent error response format
const rateLimitHandler = (req: Request, res: Response) => {
  res.status(429).json({
    success: false,
    message: "Too many requests. Please try again later.",
  });
};

// --------------------------------------------
// Login/SSO/Credential-based auth - sabse strict
// (brute-force password guessing rokने ke liye)
// --------------------------------------------
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: true, // sirf failed attempts count karo, successful logins nahi
});

// --------------------------------------------
// Refresh token endpoint - normal usage me frequent hai
// (har 15 min me access-token refresh hota hai automatically)
// --------------------------------------------
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// --------------------------------------------
// Message send (REST) - moderate, taaki spam na ho
// lekin normal fast-typing users block na hon
// --------------------------------------------
export const messageSendLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 1 message/second average allowed
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// --------------------------------------------
// File upload - resource-intensive hai, strict rakhna
// --------------------------------------------
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// --------------------------------------------
// General API - loose, sirf abuse-prevention ke liye
// --------------------------------------------
export const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// --------------------------------------------
// Search endpoints - thoda strict (DB-heavy queries)
// --------------------------------------------
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

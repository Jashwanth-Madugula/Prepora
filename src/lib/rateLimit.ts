import { NextRequest } from "next/server";
import { RateLimit } from "@/models/RateLimit";
import { dbConnect } from "./db";

interface RateLimitConfig {
  key: string;         // e.g. "login:127.0.0.1"
  maxAttempts: number; // e.g. 5
  windowMs: number;    // e.g. 15 * 60 * 1000 (15 mins)
}

export function getIpAddress(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "127.0.0.1";
}

export async function checkRateLimit(config: RateLimitConfig): Promise<{
  success: boolean;
  remaining: number;
  resetTime: Date;
}> {
  await dbConnect();
  
  const now = new Date();
  const expireAt = new Date(now.getTime() + config.windowMs);

  // Find or create rate limit document atomically
  let rateLimit = await RateLimit.findOneAndUpdate(
    { key: config.key },
    { 
      $setOnInsert: { key: config.key, expireAt },
    },
    { upsert: true, new: true }
  );

  // If the record exists but has expired (in case MongoDB's background TTL cleanup hasn't run yet)
  if (rateLimit.expireAt < now) {
    rateLimit = await RateLimit.findOneAndUpdate(
      { key: config.key },
      { 
        $set: { points: 0, expireAt }
      },
      { new: true }
    ) as any;
  }

  // Increment points
  const updatedRateLimit = await RateLimit.findOneAndUpdate(
    { key: config.key },
    { $inc: { points: 1 } },
    { new: true }
  );

  if (!updatedRateLimit) {
    throw new Error("Failed to update rate limit record");
  }

  const remaining = Math.max(0, config.maxAttempts - updatedRateLimit.points);
  
  return {
    success: updatedRateLimit.points <= config.maxAttempts,
    remaining,
    resetTime: updatedRateLimit.expireAt,
  };
}

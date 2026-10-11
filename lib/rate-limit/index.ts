import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

export class RateLimitError extends Error {
  constructor(public retryAfterSeconds: number) {
    super("Rate limited");
  }
}

type Window = `${number} ${"s" | "m" | "h" | "d"}`;

// Named policies so limits live in one place.
const POLICIES = {
  // Public requester actions
  verifyStartPerLink: { limit: 10, window: "1 h" },
  verifyStartPerIp: { limit: 20, window: "1 h" },
  verifyStartPerEmail: { limit: 5, window: "1 h" },
  verifyConfirmPerIp: { limit: 30, window: "1 h" },
  requestPerLink: { limit: 20, window: "1 d" },
  linkViewPerIp: { limit: 120, window: "1 h" },
  documentViewPerIp: { limit: 120, window: "1 h" },
  // Renter actions
  aiDraftPerUser: { limit: 30, window: "1 d" },
  uploadPerUser: { limit: 60, window: "1 h" },
  invitePerUser: { limit: 20, window: "1 d" },
} satisfies Record<string, { limit: number; window: Window }>;

export type RateLimitPolicy = keyof typeof POLICIES;

const limiters = new Map<RateLimitPolicy, Ratelimit>();
let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis === undefined) {
    redis = env.upstashUrl && env.upstashToken ? new Redis({ url: env.upstashUrl, token: env.upstashToken }) : null;
  }
  return redis;
}

// In-memory fallback for local development only. Serverless instances don't
// share memory, so production must configure Upstash.
const memory = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };

function memoryLimit(key: string, limit: number, window: Window) {
  const [amount, unit] = window.split(" ") as [string, keyof typeof WINDOW_MS];
  const ms = Number(amount) * WINDOW_MS[unit];
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.resetAt < now) {
    memory.set(key, { count: 1, resetAt: now + ms });
    return { success: true, reset: now + ms };
  }
  entry.count += 1;
  return { success: entry.count <= limit, reset: entry.resetAt };
}

/** Throws RateLimitError when `key` has exceeded the policy. */
export async function rateLimit(policy: RateLimitPolicy, key: string): Promise<void> {
  const { limit, window } = POLICIES[policy];
  const client = getRedis();

  let result: { success: boolean; reset: number };
  if (client) {
    let limiter = limiters.get(policy);
    if (!limiter) {
      limiter = new Ratelimit({
        redis: client,
        limiter: Ratelimit.slidingWindow(limit, window),
        prefix: `rp:${policy}`,
      });
      limiters.set(policy, limiter);
    }
    result = await limiter.limit(key);
  } else {
    if (process.env.NODE_ENV === "production") {
      console.warn("Rate limiting is using in-memory storage. Configure Upstash for production.");
    }
    result = memoryLimit(`${policy}:${key}`, limit, window);
  }

  if (!result.success) {
    throw new RateLimitError(Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)));
  }
}

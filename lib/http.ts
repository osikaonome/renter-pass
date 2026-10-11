import "server-only";
import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { UnauthorizedError } from "@/lib/dal";
import { RateLimitError } from "@/lib/rate-limit";
import { sha256 } from "@/lib/security/tokens";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function parseJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
  return schema.parse(body);
}

/** Wraps a route handler so thrown errors become consistent JSON responses. */
export function handle<Args extends unknown[]>(fn: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (error) {
      // Let Next.js internal signals (prerender bail-outs, redirects) through.
      unstable_rethrow(error);
      if (error instanceof ZodError) {
        return NextResponse.json({ error: "Invalid input", issues: error.issues }, { status: 400 });
      }
      if (error instanceof UnauthorizedError) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } },
        );
      }
      if (error instanceof HttpError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      console.error(error);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
  };
}

/** Hashed client IP, for rate-limit keys only. Raw IPs are never stored. */
export function clientIp(request: Request): string {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return sha256(ip);
}

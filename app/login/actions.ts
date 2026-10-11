"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { status: "idle" | "sent" | "error"; message?: string; email?: string; next?: string };

const emailSchema = z.object({
  email: z.email("Enter a valid email address"),
  next: z.string().optional(),
});

function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

/**
 * Sends one email containing both a magic link and a one-time code. The code
 * matters for the installed app on iPhone: links open in Safari, not the app,
 * so typing the code is the only way to sign in inside the app.
 */
export async function sendSignInEmail(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = emailSchema.safeParse({ email: formData.get("email"), next: formData.get("next") || undefined });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };

  const { email, next } = parsed.data;
  const redirectTo = new URL("/auth/callback", env.siteUrl);
  redirectTo.searchParams.set("next", safeNext(next));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo.toString(), shouldCreateUser: true },
  });
  if (error) {
    return {
      status: "error",
      email,
      message: error.status === 429 ? "Too many attempts. Wait a minute, then try again." : "We couldn't send the email. Please try again.",
    };
  }
  return { status: "sent", email, next };
}

export type CodeState = { error?: string };

const codeSchema = z.object({
  email: z.email(),
  code: z.string().regex(/^\d{6,10}$/, "Enter the code from the email"),
  next: z.string().optional(),
});

export async function verifySignInCode(_prev: CodeState, formData: FormData): Promise<CodeState> {
  const parsed = codeSchema.safeParse({
    email: formData.get("email"),
    code: String(formData.get("code") ?? "").replace(/\D/g, ""),
    next: formData.get("next") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: parsed.data.email, token: parsed.data.code, type: "email" });
  if (error) return { error: "That code is wrong or has expired. Check the latest email, or send a new one." };

  redirect(safeNext(parsed.data.next));
}

import "server-only";
import type { ReactElement } from "react";
import { Resend } from "resend";
import { env } from "@/lib/env";

let resend: Resend | null | undefined;

export async function sendEmail({ to, subject, react }: { to: string; subject: string; react: ReactElement }) {
  resend ??= env.resendApiKey ? new Resend(env.resendApiKey) : null;
  if (!resend) {
    // Local development without Resend: log instead of sending.
    console.info(`[email:dev] to=${to} subject="${subject}"`);
    return;
  }
  const { error } = await resend.emails.send({ from: env.emailFrom, to, subject, react });
  if (error) throw new Error(`Email failed: ${error.message}`);
}

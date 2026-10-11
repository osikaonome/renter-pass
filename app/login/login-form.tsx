"use client";

import { use, useActionState, useState } from "react";
import { ChevronLeftIcon, MailIcon } from "@/components/icons";
import { Alert, Button, Field } from "@/components/ui";
import { sendSignInEmail, verifySignInCode, type CodeState, type LoginState } from "./actions";

export function LoginForm({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = use(searchParams);
  const next = typeof params.next === "string" ? params.next : "";
  const linkError = params.error === "link";
  const [state, sendAction, sending] = useActionState<LoginState, FormData>(sendSignInEmail, { status: "idle" });
  const [editing, setEditing] = useState(false);

  if (state.status === "sent" && !editing) {
    return <CodeStep email={state.email!} next={next} onChangeEmail={() => setEditing(true)} resend={sendAction} resending={sending} />;
  }

  return (
    <form action={(fd) => { setEditing(false); sendAction(fd); }} className="flex flex-col gap-5">
      {linkError && (
        <Alert tone="warning" title="That link didn't work">
          It may have expired or already been used. Enter your email for a new one.
        </Alert>
      )}
      <input type="hidden" name="next" value={next} />
      <Field label="Email address" error={state.status === "error" ? state.message : undefined}>
        {(props) => (
          <input {...props} name="email" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} required defaultValue={state.email} placeholder="you@example.com" autoFocus />
        )}
      </Field>
      <Button type="submit" size="lg" disabled={sending}>
        {sending ? "Sending…" : "Continue with email"}
      </Button>
      <p className="text-center text-[13px] text-muted">
        No password needed. New here? This creates your free account.
      </p>
    </form>
  );
}

function CodeStep({
  email,
  next,
  onChangeEmail,
  resend,
  resending,
}: {
  email: string;
  next: string;
  onChangeEmail: () => void;
  resend: (fd: FormData) => void;
  resending: boolean;
}) {
  const [state, verifyAction, verifying] = useActionState<CodeState, FormData>(verifySignInCode, {});
  const [resent, setResent] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3 rounded-lg border border-primary-line bg-primary-soft p-4">
        <MailIcon size={20} className="mt-0.5 shrink-0 text-primary-ink" />
        <p className="text-sm">
          We sent an email to <strong className="break-all">{email}</strong>. Tap the link in it, or enter the code below.
        </p>
      </div>

      <form action={verifyAction} className="flex flex-col gap-4">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />
        <Field label="Code from the email" error={state.error}>
          {(props) => (
            <input
              {...props}
              name="code"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]*"
              maxLength={12}
              placeholder="123456"
              autoFocus
              className={`${props.className} tabular text-center font-mono text-[22px] tracking-[0.4em]`}
            />
          )}
        </Field>
        <Button type="submit" size="lg" disabled={verifying}>
          {verifying ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={onChangeEmail} className="inline-flex items-center gap-1 font-medium text-muted hover:text-ink">
          <ChevronLeftIcon size={16} /> Different email
        </button>
        <button
          type="button"
          disabled={resending}
          className="font-semibold text-primary-ink hover:underline disabled:opacity-50"
          onClick={() => {
            const fd = new FormData();
            fd.set("email", email);
            fd.set("next", next);
            resend(fd);
            setResent(true);
          }}
        >
          {resending ? "Sending…" : resent ? "Sent again" : "Resend email"}
        </button>
      </div>
    </div>
  );
}

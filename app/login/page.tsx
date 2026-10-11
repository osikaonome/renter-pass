import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Wordmark } from "@/components/brand";
import { EyeIcon, LockIcon, ShieldCheckIcon } from "@/components/icons";
import { Skeleton } from "@/components/ui";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const POINTS = [
  { Icon: LockIcon, title: "Locked by default", body: "Your documents are invisible until you approve a request." },
  { Icon: ShieldCheckIcon, title: "Verified requesters", body: "Anyone asking must prove their email first." },
  { Icon: EyeIcon, title: "Watermarked views", body: "Every page shows who it was shared with, and when." },
];

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="flex min-h-dvh">
      <aside className="relative hidden w-[44%] max-w-xl flex-col justify-between overflow-hidden bg-[#03261b] p-10 text-[#e6f4ee] lg:flex">
        <div aria-hidden className="locked-stripes absolute inset-0 opacity-40" />
        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2.5 font-display text-[17px] font-bold">
            <span className="flex size-7 items-center justify-center rounded-[7px] bg-[#7bd8b1] text-[#03261b]">
              <LockIcon size={15} strokeWidth={2.25} />
            </span>
            RenterPass
          </Link>
        </div>
        <div className="relative">
          <h2 className="max-w-sm font-display text-[2rem] font-bold leading-10 tracking-tight">
            Apply everywhere. <span className="text-[#7bd8b1]">Share nothing</span> until you say so.
          </h2>
          <ul className="mt-10 flex flex-col gap-6">
            {POINTS.map(({ Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#7bd8b1]">
                  <Icon size={18} />
                </span>
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-sm text-[#a9c9bc]">{body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-[13px] text-[#a9c9bc]">Hosted in the EU · Made in Dublin</p>
      </aside>

      <main id="main" className="flex flex-1 flex-col px-5 pb-10" style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top))" }}>
        <div className="lg:hidden">
          <Wordmark />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-headline font-semibold">Sign in or get started</h1>
          <p className="mb-8 mt-2 text-muted">Enter your email and we&apos;ll send you a sign-in link and code. You&apos;ll stay signed in until you sign out.</p>
          <Suspense fallback={<Skeleton className="h-40" />}>
            <LoginForm searchParams={searchParams} />
          </Suspense>
        </div>
        <p className="mx-auto max-w-sm text-center text-[12px] text-muted">
          By continuing you agree to our <Link href="/terms" className="underline">terms</Link> and{" "}
          <Link href="/privacy" className="underline">privacy policy</Link>.
        </p>
      </main>
    </div>
  );
}

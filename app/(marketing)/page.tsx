import Link from "next/link";
import { ArrowRightIcon, CheckIcon, ClockIcon, EyeIcon, LinkIcon, LockIcon, MailIcon, PenIcon, ShieldCheckIcon, UsersIcon } from "@/components/icons";
import { PassportVisual } from "@/components/passport-visual";
import { buttonClass } from "@/components/ui";

const STEPS = [
  {
    Icon: PenIcon,
    title: "Build your profile once",
    body: "Job, move-in date, budget, rental history and references. Upload documents to a private vault. About ten minutes, once.",
  },
  {
    Icon: LinkIcon,
    title: "One link per listing",
    body: "Paste a listing and get a personal message drafted from your profile. Edit it, then send the message and link in one tap.",
  },
  {
    Icon: ShieldCheckIcon,
    title: "Approve who sees what",
    body: "Landlords verify their email to request documents. You approve each one, choose how long access lasts, and can revoke it anytime.",
  },
];

const THREATS = [
  { threat: "A fake listing is used to collect ID and payslips", answer: "Documents stay locked. Every request needs a verified email and your approval." },
  { threat: "Shared documents get reused elsewhere", answer: "Each page is watermarked with the requester's name, the listing and the date." },
  { threat: "Your link gets forwarded around", answer: "A separate link per listing, view tracking, and an off switch for each." },
  { threat: "You over-share without noticing", answer: "We flag PPS numbers and bank details in uploads before anyone sees them." },
  { threat: "Access lingers after you've moved on", answer: "Access expires automatically after the period you choose." },
];

const FAQ = [
  {
    q: "Is it free?",
    a: "Yes. RenterPass is free for renters. Landlords and agents don't need an account.",
  },
  {
    q: "Does the landlord need to sign up?",
    a: "No. They open your link on any phone or computer. Only if they want documents do they verify their email with a one-time code.",
  },
  {
    q: "Do you send my documents to AI?",
    a: "Never. Message drafting uses only your profile summary (first name, job, move-in date and similar) and the listing text, through a provider that doesn't keep or train on it.",
  },
  {
    q: "Where is my data stored?",
    a: "In the EU, in a private bucket. You can download everything or delete your account from Settings at any time.",
  },
  {
    q: "Can we apply as a couple or housemates?",
    a: "Yes. Create a household and invite each other. One link shows everyone, and each person approves requests for their own documents.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-hairline">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--hairline)_1px,transparent_1px),linear-gradient(to_bottom,var(--hairline)_1px,transparent_1px)] bg-size-[56px_56px] opacity-50 mask-[radial-gradient(ellipse_at_70%_40%,black,transparent_70%)]" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] items-center gap-16 px-4 pb-24 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:px-12 lg:pb-28 lg:pt-24">
          <div>
            <p className="eyebrow inline-flex items-center gap-2 rounded-full border border-primary-line bg-primary-soft px-3 py-1 text-primary-ink">
              <span className="size-1.5 rounded-full bg-primary" /> For renters in Dublin
            </p>
            <h1 className="mt-6 font-display text-[2.375rem] font-bold leading-[1.08] tracking-[-0.035em] sm:text-[3.25rem] lg:text-[3.75rem]">
              Apply to every listing in seconds.
              <span className="block text-muted">Share your documents only when you choose.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-7 text-muted">
              One profile, one link per listing, and a personal message for each. Your payslips and ID stay locked until a verified landlord asks and you say yes.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className={buttonClass("primary", "px-6", "lg")}>
                Create your free profile <ArrowRightIcon size={18} />
              </Link>
              <Link href="/how-it-works" className={buttonClass("secondary", "px-6", "lg")}>
                See how it works
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              {["Free for renters", "No account for landlords", "EU-hosted"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <CheckIcon size={16} className="text-primary-ink" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="px-2 pb-24 sm:px-10 lg:px-0">
            <PassportVisual />
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-b border-hairline bg-surface">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1fr_1.4fr] lg:px-12 lg:py-20">
          <h2 className="font-display text-headline font-semibold sm:text-[2rem] sm:leading-10">
            Renting in Dublin means applying everywhere, fast.
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              ["Retyping", "The same job, move-in date and references, for every listing."],
              ["Resending", "Payslips and ID over email and WhatsApp, often to strangers."],
              ["Guessing", "No idea who opened your application or kept your documents."],
            ].map(([k, v]) => (
              <div key={k} className="border-t-2 border-ink pt-4">
                <p className="font-display text-subtitle font-semibold">{k}</p>
                <p className="mt-1.5 text-sm text-muted">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-12 lg:py-28">
        <p className="eyebrow text-primary-ink">How it works</p>
        <h2 id="how" className="mt-3 max-w-2xl font-display text-headline font-semibold sm:text-[2.25rem] sm:leading-11">
          Set up once. Apply in under a minute after that.
        </h2>
        <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline md:grid-cols-3">
          {STEPS.map(({ Icon, title, body }, i) => (
            <li key={title} className="bg-surface p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-lg bg-primary-soft text-primary-ink">
                  <Icon size={20} />
                </span>
                <span className="tabular font-display text-[2.5rem] font-bold leading-none text-hairline-strong">0{i + 1}</span>
              </div>
              <h3 className="mt-6 text-subtitle font-semibold">{title}</h3>
              <p className="mt-2 text-[15px] text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Security */}
      <section id="security" aria-labelledby="security-heading" className="scroll-mt-20 border-y border-hairline bg-surface">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:px-12 lg:py-28">
          <div>
            <p className="eyebrow text-primary-ink">Security</p>
            <h2 id="security-heading" className="mt-3 font-display text-headline font-semibold sm:text-[2.25rem] sm:leading-11">
              Built against rental scams.
            </h2>
            <p className="mt-4 text-muted">
              Fake listings exist to harvest identity documents. RenterPass is designed so that even a fake landlord gets nothing without your say-so, and you can see exactly what happened.
            </p>
            <div className="mt-8 flex flex-col gap-3 text-sm">
              {[
                { Icon: LockIcon, t: "Locked by default" },
                { Icon: MailIcon, t: "Verified requesters" },
                { Icon: EyeIcon, t: "Watermarked on every view" },
                { Icon: ClockIcon, t: "Access that expires" },
              ].map(({ Icon, t }) => (
                <span key={t} className="flex items-center gap-3 font-medium">
                  <Icon size={18} className="text-primary-ink" /> {t}
                </span>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-hairline">
            <div className="hidden grid-cols-2 border-b border-hairline bg-sunken px-5 py-3 sm:grid">
              <p className="eyebrow text-muted">The risk</p>
              <p className="eyebrow text-muted">What RenterPass does</p>
            </div>
            <ul>
              {THREATS.map(({ threat, answer }) => (
                <li key={threat} className="grid gap-1.5 border-b border-row px-5 py-4 last:border-0 sm:grid-cols-2 sm:gap-6">
                  <p className="text-[15px] font-medium">{threat}</p>
                  <p className="flex gap-2 text-[15px] text-muted">
                    <CheckIcon size={18} className="mt-0.5 shrink-0 text-primary-ink" /> {answer}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Landlords + households */}
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-20 sm:px-6 md:grid-cols-2 lg:px-12 lg:py-28">
        <div id="landlords" className="scroll-mt-20 rounded-xl border border-hairline bg-surface p-7 shadow-card sm:p-10">
          <p className="eyebrow text-muted">For landlords &amp; agents</p>
          <h2 className="mt-3 font-display text-title font-semibold sm:text-headline">Every applicant in the same clear format.</h2>
          <ul className="mt-6 flex flex-col gap-3 text-[15px]">
            {["Opens on any phone, no account", "Consistent, scannable profiles", "Request documents in one tap", "No more chasing attachments"].map((t) => (
              <li key={t} className="flex gap-2.5"><CheckIcon size={18} className="mt-0.5 shrink-0 text-primary-ink" /> {t}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-hairline bg-surface p-7 shadow-card sm:p-10">
          <p className="eyebrow text-muted">Couples &amp; housemates</p>
          <h2 className="mt-3 font-display text-title font-semibold sm:text-headline">Apply together. Stay in control separately.</h2>
          <p className="mt-4 text-[15px] text-muted">
            One household link shows everyone. Each person keeps their own vault and approves requests for their own documents. Nobody can share someone else&apos;s payslip.
          </p>
          <div className="mt-6 flex -space-x-2">
            {["AB", "SK", "MO"].map((i) => (
              <span key={i} className="flex size-10 items-center justify-center rounded-full border-2 border-surface bg-primary-soft font-display text-sm font-bold text-primary-ink">{i}</span>
            ))}
            <span className="flex size-10 items-center justify-center rounded-full border-2 border-surface bg-sunken text-muted"><UsersIcon size={16} /></span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq" className="border-t border-hairline bg-surface">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:px-12">
          <h2 id="faq" className="font-display text-headline font-semibold">Questions</h2>
          <div className="divide-y divide-hairline border-y border-hairline">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group py-1">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {q}
                  <span aria-hidden className="text-xl text-muted transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="pb-5 pr-8 text-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-12">
        <div className="relative overflow-hidden rounded-xl bg-[#03261b] px-6 py-14 text-center text-[#e6f4ee] sm:px-12">
          <div aria-hidden className="locked-stripes absolute inset-0 opacity-40" />
          <h2 className="relative mx-auto max-w-xl font-display text-headline font-bold sm:text-[2.25rem] sm:leading-11">
            Your next application could take a minute.
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-[#a9c9bc]">Set up your profile tonight. Apply to the next listing before anyone else.</p>
          <Link href="/login" className="relative mt-8 inline-flex min-h-12 items-center gap-2 rounded bg-[#7bd8b1] px-6 font-semibold text-[#002115] transition-colors hover:bg-[#97f5cc]">
            Create your free profile <ArrowRightIcon size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}

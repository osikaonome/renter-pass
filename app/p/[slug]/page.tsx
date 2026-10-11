import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { DocumentIcon } from "@/components/document-icon";
import { ArrowRightIcon, BriefcaseIcon, CalendarIcon, LockIcon, QuoteIcon, UsersIcon, WalletIcon } from "@/components/icons";
import { PublicShell } from "@/components/public-shell";
import { Avatar, Skeleton, buttonClass } from "@/components/ui";
import { formatBudget, formatDate, formatMonth } from "@/lib/format";
import type { PublicLink, PublicMember } from "@/lib/public-link";
import { EMPLOYMENT_TYPE_LABELS } from "@/schemas/profile";
import { getPublicLink } from "./data";
import { ViewBeacon } from "./view-beacon";

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const link = await getPublicLink(slug);
  const robots = { index: false, follow: false };
  if (!link) return { title: "Link not available", robots };
  const names = link.members.map((m) => m.firstName).join(" & ");
  const headline = link.household ? `${link.household.name}, applying together` : link.members[0]?.headline;
  return {
    title: `${names}'s rental application`,
    description: headline || "Rental application on RenterPass",
    robots,
    referrer: "no-referrer",
  };
}

export default function PublicProfilePage({ params }: PageProps<"/p/[slug]">) {
  return (
    <PublicShell>
      <Suspense fallback={<ProfileSkeleton />}>
        <Profile params={params} />
      </Suspense>
    </PublicShell>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading application">
      <Skeleton className="h-44" />
      <Skeleton className="h-28" />
      <Skeleton className="h-48" />
    </div>
  );
}

async function Profile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const link = await getPublicLink(slug);
  if (!link) notFound();
  const household = !!link.household;

  return (
    <>
      <ViewBeacon slug={slug} />
      <p className="eyebrow mb-3 text-muted">{household ? "Household application" : "Rental application"}</p>

      {household ? <HouseholdHeader link={link} /> : <MemberHeader member={link.members[0]} />}

      <div className="mt-4 flex flex-col gap-4">
        {household ? link.members.map((m) => <MemberCard key={m.id} member={m} />) : <MemberDetails member={link.members[0]} />}
        <Documents link={link} slug={slug} />
      </div>

      {/* Phones: keep the main action under the thumb. */}
      {link.documents.length > 0 && (
        <div className="sticky bottom-0 z-10 -mx-4 mt-6 border-t border-hairline bg-surface/95 px-4 pt-3 backdrop-blur-md sm:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <Link href={`/p/${slug}/request`} className={buttonClass("primary", "w-full", "lg")}>
            Request documents <ArrowRightIcon size={18} />
          </Link>
        </div>
      )}
    </>
  );
}

function Panel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-hairline bg-surface p-5 shadow-card sm:p-6">
      {title && <h2 className="eyebrow mb-3 text-muted">{title}</h2>}
      {children}
    </section>
  );
}

function Facts({ items }: { items: { icon: ReactNode; label: string; value: string }[] }) {
  if (!items.length) return null;
  return (
    <dl className="grid grid-cols-2 border-t border-hairline sm:grid-cols-4">
      {items.map((f, i) => (
        <div key={f.label} className={`border-hairline p-4 ${i % 2 === 0 ? "border-r" : ""} ${i < items.length - 2 ? "border-b sm:border-b-0" : ""} sm:border-r sm:last:border-r-0`}>
          <dt className="eyebrow flex items-center gap-1.5 text-muted">{f.icon} {f.label}</dt>
          <dd className="tabular mt-1.5 font-display text-[15px] font-semibold leading-5 sm:text-subtitle">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function memberFacts(m: PublicMember) {
  const facts: { icon: ReactNode; label: string; value: string }[] = [];
  if (m.moveInDate) facts.push({ icon: <CalendarIcon size={12} />, label: "Move-in", value: formatDate(m.moveInDate) });
  if (m.budgetMin || m.budgetMax) facts.push({ icon: <WalletIcon size={12} />, label: "Budget", value: formatBudget(m.budgetMin, m.budgetMax).replace(" / month", "/mo") });
  if (m.householdSize) facts.push({ icon: <UsersIcon size={12} />, label: "People", value: String(m.householdSize) });
  if (m.employmentType) facts.push({ icon: <BriefcaseIcon size={12} />, label: "Work", value: EMPLOYMENT_TYPE_LABELS[m.employmentType] });
  return facts;
}

function MemberHeader({ member: m }: { member: PublicMember }) {
  return (
    <section className="overflow-hidden rounded-xl border border-hairline bg-surface shadow-card">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        <Avatar name={`${m.firstName} ${m.lastName}`} src={m.photoUrl} size={80} />
        <div className="min-w-0">
          <h1 className="font-display text-headline font-semibold sm:text-[2rem] sm:leading-10">
            {m.firstName} {m.lastName}
          </h1>
          {m.headline && <p className="mt-1 text-[16px] text-muted">{m.headline}</p>}
        </div>
      </div>
      <Facts items={memberFacts(m)} />
    </section>
  );
}

function HouseholdHeader({ link }: { link: PublicLink }) {
  const hh = link.household!;
  const facts: { icon: ReactNode; label: string; value: string }[] = [{ icon: <UsersIcon size={12} />, label: "People", value: String(link.members.length) }];
  if (hh.moveInDate) facts.push({ icon: <CalendarIcon size={12} />, label: "Move-in", value: formatDate(hh.moveInDate) });
  if (hh.combinedBudget) facts.push({ icon: <WalletIcon size={12} />, label: "Budget", value: formatBudget(null, hh.combinedBudget).replace(" / month", "/mo") });
  return (
    <section className="overflow-hidden rounded-xl border border-hairline bg-surface shadow-card">
      <div className="p-5 sm:p-6">
        <div className="flex -space-x-3">
          {link.members.map((m) => (
            <Avatar key={m.id} name={`${m.firstName} ${m.lastName}`} src={m.photoUrl} size={56} className="ring-4 ring-surface" />
          ))}
        </div>
        <h1 className="mt-4 font-display text-headline font-semibold sm:text-[2rem] sm:leading-10">{hh.name}</h1>
        <p className="mt-1 text-muted">{link.members.map((m) => m.firstName).join(", ")} · applying together</p>
        {hh.summary && <p className="mt-4 whitespace-pre-wrap leading-7">{hh.summary}</p>}
      </div>
      <Facts items={facts} />
    </section>
  );
}

function History({ member: m }: { member: PublicMember }) {
  if (!m.rentalHistory.length) return null;
  return (
    <ol className="relative ml-1 border-l border-hairline-strong">
      {m.rentalHistory.map((h, i) => (
        <li key={i} className="relative pb-4 pl-5 last:pb-0">
          <span aria-hidden className={`absolute -left-1.25 top-1.5 size-2.5 rounded-full ${i === 0 ? "bg-primary" : "border-2 border-hairline-strong bg-surface"}`} />
          <p className="font-medium">{h.address}</p>
          <p className="tabular text-[13px] text-muted">
            {formatMonth(h.from)} – {formatMonth(h.to || undefined)}
          </p>
        </li>
      ))}
    </ol>
  );
}

function References({ member: m }: { member: PublicMember }) {
  if (!m.references.length) return null;
  return (
    <>
      <ul className="divide-y divide-row">
        {m.references.map((r, i) => (
          <li key={i} className="flex items-center justify-between gap-3 py-2.5">
            <span className="font-medium">{r.name}</span>
            <span className="text-sm text-muted">{r.relationship}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[13px] text-muted">Contact details available from the applicant.</p>
    </>
  );
}

function MemberDetails({ member: m }: { member: PublicMember }) {
  const job = [m.occupation, m.employer && `at ${m.employer}`].filter(Boolean).join(" ");
  const lifestyle = [m.pets && `Pets: ${m.pets}`, m.smoker !== null && (m.smoker ? "Smoker" : "Non-smoker")].filter(Boolean) as string[];
  return (
    <>
      {m.intro && (
        <Panel>
          <QuoteIcon size={18} className="text-subtle" />
          <p className="mt-2 whitespace-pre-wrap text-[16px] leading-7">{m.intro}</p>
        </Panel>
      )}
      {(job || lifestyle.length > 0) && (
        <Panel title="Work & lifestyle">
          {job && <p className="text-[16px] font-medium">{job}</p>}
          {lifestyle.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {lifestyle.map((l) => (
                <span key={l} className="rounded border border-hairline bg-sunken px-2.5 py-1 text-[13px] font-medium">{l}</span>
              ))}
            </div>
          )}
        </Panel>
      )}
      {m.rentalHistory.length > 0 && (
        <Panel title="Rental history">
          <History member={m} />
        </Panel>
      )}
      {m.references.length > 0 && (
        <Panel title="References">
          <References member={m} />
        </Panel>
      )}
    </>
  );
}

/** Household members: one compact card each, details folded under a native disclosure. */
function MemberCard({ member: m }: { member: PublicMember }) {
  const job = [m.occupation, m.employer && `at ${m.employer}`].filter(Boolean).join(" ");
  return (
    <section className="rounded-lg border border-hairline bg-surface shadow-card">
      <div className="flex items-center gap-4 p-5">
        <Avatar name={`${m.firstName} ${m.lastName}`} src={m.photoUrl} size={52} />
        <div className="min-w-0">
          <h2 className="font-display text-subtitle font-semibold">{m.firstName} {m.lastName}</h2>
          <p className="text-sm text-muted">{job || m.headline}</p>
        </div>
      </div>
      {(m.intro || m.rentalHistory.length > 0 || m.references.length > 0) && (
        <details className="group border-t border-hairline">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 text-sm font-semibold text-primary-ink">
            More about {m.firstName}
            <span aria-hidden className="transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <div className="flex flex-col gap-5 px-5 pb-5">
            {m.intro && <p className="whitespace-pre-wrap leading-7">{m.intro}</p>}
            {m.rentalHistory.length > 0 && (
              <div>
                <p className="eyebrow mb-3 text-muted">Rental history</p>
                <History member={m} />
              </div>
            )}
            {m.references.length > 0 && (
              <div>
                <p className="eyebrow mb-1 text-muted">References</p>
                <References member={m} />
              </div>
            )}
          </div>
        </details>
      )}
    </section>
  );
}

function Documents({ link, slug }: { link: PublicLink; slug: string }) {
  const household = !!link.household;
  return (
    <section className="overflow-hidden rounded-lg border border-hairline bg-surface shadow-card" aria-labelledby="docs-heading">
      <div className="flex flex-col gap-1 p-5 sm:p-6">
        <h2 id="docs-heading" className="eyebrow text-muted">Documents</h2>
        <p className="font-display text-subtitle font-semibold">
          {link.documents.length ? "Available on request" : "No documents added yet"}
        </p>
        {link.documents.length > 0 && (
          <p className="text-sm text-muted">
            Verify your email, choose what you need, and {household ? "each person approves their own" : `${link.members[0]?.firstName} approves`}. Access is time-limited and watermarked with your name.
          </p>
        )}
      </div>
      {link.documents.length > 0 && (
        <>
          <ul className="grid gap-2 px-5 sm:grid-cols-2 sm:px-6">
            {link.documents.map((d) => (
              <li key={d.id} className="locked-stripes flex items-center gap-3 rounded-lg border border-hairline p-3">
                <DocumentIcon category={d.category} className="size-9 bg-surface" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{d.label}</span>
                  {household && <span className="block text-[12px] text-muted">{d.ownerFirstName}</span>}
                </span>
                <LockIcon size={15} className="shrink-0 text-subtle" />
              </li>
            ))}
          </ul>
          <div className="hidden p-6 sm:block">
            <Link href={`/p/${slug}/request`} className={buttonClass("primary")}>
              Request documents <ArrowRightIcon size={18} />
            </Link>
          </div>
          <div className="h-5 sm:hidden" />
        </>
      )}
    </section>
  );
}

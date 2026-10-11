"use client";

import { useState, type FormEvent } from "react";
import { CalendarIcon, LockIcon, MailIcon, UsersIcon, WalletIcon, XIcon } from "@/components/icons";
import { Sheet } from "@/components/sheet";
import { Alert, Avatar, Button, Card, CardHeader, Field, Pill, Skeleton } from "@/components/ui";
import {
  useCancelInvite,
  useCreateHousehold,
  useHouseholds,
  useInvite,
  useLeaveHousehold,
  useUpdateHousehold,
  type HouseholdWithMembers,
} from "@/hooks/use-households";
import { formatBudget, formatDate, formatRelative } from "@/lib/format";

export function HouseholdManager() {
  const { data, isPending, error } = useHouseholds();
  if (isPending) return <Skeleton className="h-72" />;
  if (error) return <Alert tone="danger">{error.message}</Alert>;

  return (
    <div className="flex flex-col gap-6">
      {data.pendingInvites.length > 0 && (
        <Alert tone="info" title="You've been invited">
          Open the link in your invite email to join {data.pendingInvites.map((i) => i.households?.name).filter(Boolean).join(", ")}.
        </Alert>
      )}
      {data.households.map((h) => (
        <HouseholdCard key={h.id} household={h} />
      ))}
      {data.households.length === 0 ? <CreateHousehold first /> : <CreateHousehold />}
    </div>
  );
}

function CreateHousehold({ first = false }: { first?: boolean }) {
  const create = useCreateHousehold();
  const [name, setName] = useState("");
  const form = (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate(name, { onSuccess: () => setName("") });
      }}
    >
      <div className="flex-1">
        <Field label="Household name" error={create.error?.message}>
          {(props) => <input {...props} required maxLength={80} placeholder="Aoife & Sam" value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
      </div>
      <Button type="submit" size="lg" className="sm:min-h-11" disabled={create.isPending}>
        Create household
      </Button>
    </form>
  );

  if (!first) {
    return (
      <details className="group rounded-lg border border-dashed border-hairline-strong p-4">
        <summary className="cursor-pointer list-none text-sm font-semibold text-muted group-open:mb-4 group-open:text-ink">+ Create another household</summary>
        {form}
      </details>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-2">
        <div>
          <span className="flex size-11 items-center justify-center rounded-lg bg-primary-soft text-primary-ink">
            <UsersIcon />
          </span>
          <h2 className="mt-4 text-title font-semibold">Apply as a household</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-muted">
            <li className="flex gap-2"><span className="text-primary-ink">•</span> One link shows everyone together</li>
            <li className="flex gap-2"><span className="text-primary-ink">•</span> Each person approves their own documents</li>
            <li className="flex gap-2"><span className="text-primary-ink">•</span> Anyone can leave, and their data leaves with them</li>
          </ul>
        </div>
        <div className="flex flex-col justify-end">{form}</div>
      </div>
    </Card>
  );
}

function HouseholdCard({ household }: { household: HouseholdWithMembers }) {
  const invite = useInvite();
  const cancel = useCancelInvite();
  const leave = useLeaveHousehold();
  const [email, setEmail] = useState("");
  const [editing, setEditing] = useState(false);
  const isOwner = household.is_owner; // UI hint only; enforced by the API and RLS

  function onInvite(e: FormEvent) {
    e.preventDefault();
    invite.mutate({ householdId: household.id, email }, { onSuccess: () => setEmail("") });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <Card className="lg:col-span-7" aria-labelledby={`hh-${household.id}`}>
        <CardHeader
          id={`hh-${household.id}`}
          title={household.name}
          description={`${household.members.length} member${household.members.length === 1 ? "" : "s"}`}
        />
        <ul>
          {household.members.map((m) => (
            <li key={m.profile_id} className="flex items-center gap-3 border-b border-row px-5 py-3.5">
              <Avatar name={`${m.first_name} ${m.last_name}`} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{`${m.first_name} ${m.last_name}`.trim() || "New member"}</p>
                <p className="truncate text-[13px] text-muted">{m.occupation || m.headline || "Profile in progress"}</p>
              </div>
              {m.role === "owner" && <Pill tone="verified">Owner</Pill>}
            </li>
          ))}
          {household.invites.map((i) => (
            <li key={i.id} className="flex items-center gap-3 border-b border-row px-5 py-3.5">
              <span className="flex size-10 items-center justify-center rounded-full border border-dashed border-hairline-strong text-subtle">
                <MailIcon size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{i.invited_email}</p>
                <p className="text-[13px] text-muted">Invited {formatRelative(i.invited_at)}</p>
              </div>
              <Pill tone="pending">Invited</Pill>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => cancel.mutate(i.id)}
                  disabled={cancel.isPending}
                  aria-label={`Cancel invite to ${i.invited_email}`}
                  className="inline-flex size-9 items-center justify-center rounded-md text-muted hover:bg-sunken hover:text-ink"
                >
                  <XIcon size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
        {isOwner && (
          <form onSubmit={onInvite} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Field label="Invite by email" error={invite.error?.message} hint={invite.isSuccess ? "Invite sent." : "They'll need to sign in with this email to accept."}>
                {(props) => <input {...props} type="email" inputMode="email" autoComplete="off" required placeholder="sam@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />}
              </Field>
            </div>
            <Button type="submit" variant="secondary" className="sm:mb-6" disabled={invite.isPending}>
              {invite.isPending ? "Sending…" : "Send invite"}
            </Button>
          </form>
        )}
        <div className="flex items-start gap-2 border-t border-hairline bg-sunken px-5 py-3 text-[13px] text-muted">
          <LockIcon size={14} className="mt-0.5 shrink-0" />
          Members see each other&apos;s public profile only. Nobody can see or share another member&apos;s documents.
        </div>
      </Card>

      <div className="flex flex-col gap-6 lg:col-span-5">
        <Card aria-labelledby={`summary-${household.id}`}>
          <CardHeader
            id={`summary-${household.id}`}
            title="Shared summary"
            description="Shown at the top of household links."
            action={isOwner && <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit</Button>}
          />
          <dl className="px-5 py-2">
            <div className="flex items-center gap-3 border-b border-row py-3">
              <CalendarIcon size={18} className="text-subtle" />
              <dt className="sr-only">Move-in</dt>
              <dd>{household.move_in_date ? `Moving in ${formatDate(household.move_in_date)}` : <span className="text-muted">Move-in date not set</span>}</dd>
            </div>
            <div className="flex items-center gap-3 border-b border-row py-3">
              <WalletIcon size={18} className="text-subtle" />
              <dt className="sr-only">Budget</dt>
              <dd className="tabular">{household.combined_budget ? formatBudget(null, household.combined_budget) : <span className="text-muted">Budget not set</span>}</dd>
            </div>
            {household.summary && <p className="whitespace-pre-wrap py-3 text-sm">{household.summary}</p>}
          </dl>
        </Card>

        <Button
          variant="quiet-danger"
          className="self-start"
          disabled={leave.isPending}
          onClick={() =>
            confirm("Leave this household? Household links you created will be switched off and access you gave through household links will end.") &&
            leave.mutate(household.id)
          }
        >
          Leave household
        </Button>
      </div>

      <Sheet open={editing} onClose={() => setEditing(false)} title="Shared summary">
        {editing && <SummaryForm household={household} onDone={() => setEditing(false)} />}
      </Sheet>
    </div>
  );
}

function SummaryForm({ household, onDone }: { household: HouseholdWithMembers; onDone: () => void }) {
  const update = useUpdateHousehold();
  const [moveIn, setMoveIn] = useState(household.move_in_date ?? "");
  const [budget, setBudget] = useState(household.combined_budget?.toString() ?? "");
  const [summary, setSummary] = useState(household.summary ?? "");
  return (
    <form
      className="flex flex-col gap-5 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        update.mutate(
          { id: household.id, move_in_date: moveIn || null, combined_budget: budget ? Number(budget) : null, summary: summary || null },
          { onSuccess: onDone },
        );
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Move-in date">
          {(props) => <input {...props} type="date" value={moveIn} onChange={(e) => setMoveIn(e.target.value)} />}
        </Field>
        <Field label="Combined budget (€/mo)">
          {(props) => <input {...props} type="number" min={0} inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value)} />}
        </Field>
      </div>
      <Field label="About the household" error={update.error?.message}>
        {(props) => <textarea {...props} rows={4} maxLength={1000} placeholder="Two professionals, quiet, both working full-time…" value={summary} onChange={(e) => setSummary(e.target.value)} />}
      </Field>
      <Button type="submit" size="lg" disabled={update.isPending}>
        {update.isPending ? "Saving…" : "Save summary"}
      </Button>
    </form>
  );
}

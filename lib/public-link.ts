import "server-only";
import { cookies } from "next/headers";
import { createAdminClient, PHOTOS_BUCKET } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { sign, verify } from "@/lib/security/tokens";
import type { DocumentCategory, EmploymentType, RentalHistoryEntry } from "@/lib/types";

// Fields that may be shown to anyone holding the link. Email, phone numbers,
// reference contact details and documents are deliberately excluded.
const PUBLIC_PROFILE_COLUMNS =
  "id, first_name, last_name, photo_path, headline, intro, occupation, employer, employment_type, move_in_date, budget_min, budget_max, pets, smoker, household_size, rental_history, references";

export type PublicMember = {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  headline: string;
  intro: string;
  occupation: string;
  employer: string | null;
  employmentType: EmploymentType | null;
  moveInDate: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  pets: string | null;
  smoker: boolean | null;
  householdSize: number | null;
  rentalHistory: Pick<RentalHistoryEntry, "address" | "from" | "to">[];
  references: { name: string; relationship: string }[];
};

export type RequestableDocument = {
  id: string;
  label: string;
  category: DocumentCategory;
  ownerFirstName: string;
};

export type PublicLink = {
  id: string;
  slug: string;
  label: string;
  ownerProfileId: string;
  household: { name: string; moveInDate: string | null; combinedBudget: number | null; summary: string | null } | null;
  members: PublicMember[];
  documents: RequestableDocument[];
};

type ProfileRow = {
  id: string;
  first_name: string;
  last_name: string;
  photo_path: string | null;
  headline: string;
  intro: string;
  occupation: string;
  employer: string | null;
  employment_type: EmploymentType | null;
  move_in_date: string | null;
  budget_min: number | null;
  budget_max: number | null;
  pets: string | null;
  smoker: boolean | null;
  household_size: number | null;
  rental_history: RentalHistoryEntry[];
  references: { name: string; relationship: string }[];
};

/** Returns null for unknown, revoked or orphaned links. */
export async function loadPublicLink(slug: string, { withPhotos = true } = {}): Promise<PublicLink | null> {
  if (!/^[a-z0-9]{12,32}$/.test(slug)) return null;
  const admin = createAdminClient();

  const { data: link } = await admin
    .from("share_links")
    .select("id, slug, label, owner_profile_id, kind, household_id, revoked_at")
    .eq("slug", slug)
    .maybeSingle();
  if (!link || link.revoked_at) return null;
  if (link.kind === "household" && !link.household_id) return null;

  let profileIds = [link.owner_profile_id as string];
  let household: PublicLink["household"] = null;

  if (link.kind === "household") {
    const [{ data: hh }, { data: members }] = await Promise.all([
      admin
        .from("households")
        .select("name, move_in_date, combined_budget, summary")
        .eq("id", link.household_id)
        .maybeSingle(),
      admin
        .from("household_members")
        .select("profile_id, role")
        .eq("household_id", link.household_id)
        .eq("status", "accepted"),
    ]);
    if (!hh) return null;
    const ids = (members ?? []).map((m) => m.profile_id as string);
    // The link creator must still belong to the household.
    if (!ids.includes(link.owner_profile_id)) return null;
    profileIds = [link.owner_profile_id, ...ids.filter((id) => id !== link.owner_profile_id)];
    household = {
      name: hh.name,
      moveInDate: hh.move_in_date,
      combinedBudget: hh.combined_budget,
      summary: hh.summary,
    };
  }

  const [{ data: profiles }, { data: docs }] = await Promise.all([
    admin.from("profiles").select(PUBLIC_PROFILE_COLUMNS).in("id", profileIds).returns<ProfileRow[]>(),
    admin.from("documents").select("id, label, category, profile_id").in("profile_id", profileIds),
  ]);

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  const members = await Promise.all(
    profileIds
      .map((id) => byId.get(id))
      .filter((p): p is ProfileRow => !!p)
      .map(async (p): Promise<PublicMember> => {
        let photoUrl: string | null = null;
        if (withPhotos && p.photo_path) {
          const { data } = await admin.storage.from(PHOTOS_BUCKET).createSignedUrl(p.photo_path, 60 * 60);
          photoUrl = data?.signedUrl ?? null;
        }
        return {
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          photoUrl,
          headline: p.headline,
          intro: p.intro,
          occupation: p.occupation,
          employer: p.employer,
          employmentType: p.employment_type,
          moveInDate: p.move_in_date,
          budgetMin: p.budget_min,
          budgetMax: p.budget_max,
          pets: p.pets,
          smoker: p.smoker,
          householdSize: p.household_size,
          rentalHistory: (p.rental_history ?? []).map(({ address, from, to }) => ({ address, from, to })),
          references: (p.references ?? []).map(({ name, relationship }) => ({ name, relationship })),
        };
      }),
  );

  const firstNames = new Map(members.map((m) => [m.id, m.firstName]));
  return {
    id: link.id,
    slug: link.slug,
    label: link.label,
    ownerProfileId: link.owner_profile_id,
    household,
    members,
    documents: (docs ?? []).map((d) => ({
      id: d.id,
      label: d.label,
      category: d.category,
      ownerFirstName: firstNames.get(d.profile_id) ?? "",
    })),
  };
}

// ---------------------------------------------------------------------------
// Requester session: set after the one-time code is confirmed. Scoped to one
// link and short-lived, so it can only be used to submit a request on that link.
// ---------------------------------------------------------------------------

const REQUESTER_COOKIE = "rp_requester";
const REQUESTER_TTL_SECONDS = 60 * 60;

export type RequesterSession = {
  verificationId: string;
  linkId: string;
  name: string;
  email: string;
  exp: number;
};

export async function setRequesterSession(session: Omit<RequesterSession, "exp">) {
  const exp = Math.floor(Date.now() / 1000) + REQUESTER_TTL_SECONDS;
  (await cookies()).set(REQUESTER_COOKIE, sign({ ...session, exp }, env.appSecret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/public/",
    maxAge: REQUESTER_TTL_SECONDS,
  });
}

export async function getRequesterSession(linkId: string): Promise<RequesterSession | null> {
  const session = verify<RequesterSession>((await cookies()).get(REQUESTER_COOKIE)?.value, env.appSecret);
  if (!session || session.linkId !== linkId || session.exp < Date.now() / 1000) return null;
  return session;
}

export async function clearRequesterSession() {
  (await cookies()).delete({ name: REQUESTER_COOKIE, path: "/api/public/" });
}

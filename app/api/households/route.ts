import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/dal";
import { handle, HttpError, parseJson } from "@/lib/http";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHouseholdSchema } from "@/schemas/household";

/** Households the caller belongs to, with members' public fields and pending invites. */
export const GET = handle(async () => {
  const { supabase, profile } = await requireApiSession();

  const { data: memberships } = await supabase
    .from("household_members")
    .select("household_id, households(*)")
    .eq("profile_id", profile.id)
    .eq("status", "accepted");

  const households = await Promise.all(
    (memberships ?? []).map(async (m) => {
      const [{ data: members }, { data: roster }] = await Promise.all([
        supabase.rpc("household_member_profiles", { hid: m.household_id }),
        supabase
          .from("household_members")
          .select("id, invited_email, status, role, invited_at")
          .eq("household_id", m.household_id)
          .eq("status", "invited"),
      ]);
      const household = m.households as unknown as { owner_profile_id: string };
      return {
        ...household,
        is_owner: household.owner_profile_id === profile.id,
        members: members ?? [],
        invites: roster ?? [],
      };
    }),
  );

  // Invites addressed to the caller's email that they haven't accepted yet.
  // Read with the service role: the caller isn't a member yet, so RLS hides them.
  const admin = createAdminClient();
  const { data: pendingInvites } = await admin
    .from("household_members")
    .select("id, invited_at, households(name)")
    .eq("invited_email", profile.email.toLowerCase())
    .eq("status", "invited");

  return NextResponse.json({ households, pendingInvites: pendingInvites ?? [] });
});

export const POST = handle(async (request: Request) => {
  const { supabase, profile } = await requireApiSession();
  const { name } = await parseJson(request, createHouseholdSchema);

  const { data: household, error } = await supabase
    .from("households")
    .insert({ name, owner_profile_id: profile.id, move_in_date: profile.move_in_date })
    .select("*")
    .single();
  if (error) throw new HttpError(400, error.message);

  const { error: memberError } = await supabase.from("household_members").insert({
    household_id: household.id,
    profile_id: profile.id,
    role: "owner",
    status: "accepted",
    invited_email: profile.email.toLowerCase(),
    joined_at: new Date().toISOString(),
  });
  if (memberError) {
    await supabase.from("households").delete().eq("id", household.id);
    throw new HttpError(400, memberError.message);
  }
  return NextResponse.json(household, { status: 201 });
});

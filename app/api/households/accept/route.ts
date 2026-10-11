import { NextResponse, after } from "next/server";
import { requireApiSession } from "@/lib/dal";
import { handle, HttpError, parseJson } from "@/lib/http";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notifications/dispatch";
import { sha256 } from "@/lib/security/tokens";
import { acceptInviteSchema } from "@/schemas/household";

/**
 * Accept an invite. The token proves the invite link was received; the signed-in
 * email must also match the invited address, so a forwarded link is useless.
 */
export const POST = handle(async (request: Request) => {
  const { profile } = await requireApiSession();
  const { token } = await parseJson(request, acceptInviteSchema);
  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("household_members")
    .select("id, household_id, invited_email, status, households(name, owner_profile_id)")
    .eq("invite_token_hash", sha256(token))
    .maybeSingle();
  if (!invite || invite.status !== "invited") throw new HttpError(404, "This invite is no longer valid");
  if (invite.invited_email !== profile.email.toLowerCase()) {
    throw new HttpError(403, `This invite was sent to ${invite.invited_email}. Sign in with that email to accept it.`);
  }

  // Someone who left earlier keeps their old row; reuse it rather than violate
  // the (household_id, profile_id) uniqueness.
  const { data: previous } = await admin
    .from("household_members")
    .select("id")
    .eq("household_id", invite.household_id)
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (previous) await admin.from("household_members").delete().eq("id", previous.id);

  const { error } = await admin
    .from("household_members")
    .update({ profile_id: profile.id, status: "accepted", joined_at: new Date().toISOString(), invite_token_hash: null })
    .eq("id", invite.id);
  if (error) throw new HttpError(400, error.message);

  const household = invite.households as unknown as { name: string; owner_profile_id: string };
  after(() =>
    notify({
      profileId: household.owner_profile_id,
      type: "household_joined",
      payload: { householdName: household.name, memberName: profile.first_name },
    }),
  );
  return NextResponse.json({ householdId: invite.household_id });
});

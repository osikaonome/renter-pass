import { NextResponse, after } from "next/server";
import { requireApiSession } from "@/lib/dal";
import { env } from "@/lib/env";
import { handle, HttpError, parseJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { notify } from "@/lib/notifications/dispatch";
import { sendEmail } from "@/lib/email/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateToken, sha256 } from "@/lib/security/tokens";
import { HouseholdInviteEmail } from "@/emails/templates";
import { inviteSchema } from "@/schemas/household";

const MAX_MEMBERS = 6;

export const POST = handle(async (request: Request, ctx: RouteContext<"/api/households/[id]/invites">) => {
  const { supabase, profile } = await requireApiSession();
  const { id } = await ctx.params;
  await rateLimit("invitePerUser", profile.user_id);
  const email = (await parseJson(request, inviteSchema)).email.toLowerCase();

  const { data: household } = await supabase
    .from("households")
    .select("id, name, owner_profile_id")
    .eq("id", id)
    .maybeSingle();
  if (!household || household.owner_profile_id !== profile.id) {
    throw new HttpError(403, "Only the household owner can invite people");
  }
  if (email === profile.email.toLowerCase()) throw new HttpError(400, "You're already in this household");

  const { data: existing } = await supabase
    .from("household_members")
    .select("id, invited_email, status")
    .eq("household_id", id)
    .in("status", ["invited", "accepted"]);
  if ((existing ?? []).length >= MAX_MEMBERS) throw new HttpError(400, `Households can have up to ${MAX_MEMBERS} people`);
  if ((existing ?? []).some((m) => m.invited_email === email)) throw new HttpError(409, "That person is already invited");

  const token = generateToken();
  const { data: invite, error } = await supabase
    .from("household_members")
    .insert({ household_id: id, role: "member", status: "invited", invited_email: email, invite_token_hash: sha256(token) })
    .select("id, invited_email, status, role, invited_at")
    .single();
  if (error) throw new HttpError(400, error.message);

  const url = `${env.siteUrl}/household/invite/${token}`;
  const inviterName = profile.first_name || "A friend";
  after(async () => {
    // If the invitee already has an account, also notify them in-app and by push.
    const admin = createAdminClient();
    const { data: invitee } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
    const emailContent = {
      subject: `${inviterName} invited you to apply together on RenterPass`,
      react: HouseholdInviteEmail({ inviterName, householdName: household.name, url }),
    };
    if (invitee) {
      await notify({
        profileId: invitee.id,
        type: "household_invite",
        payload: { householdName: household.name, inviterName, url: `/household/invite/${token}` },
        email: emailContent,
        push: { title: "Household invite", body: `${inviterName} invited you to ${household.name}`, url },
      });
    } else {
      await sendEmail({ to: email, ...emailContent });
    }
  });

  return NextResponse.json(invite, { status: 201 });
});

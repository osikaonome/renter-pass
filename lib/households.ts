import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Remove a member from a household. Their data leaves with them:
 * - household links they created are revoked,
 * - any access they granted through household links is revoked,
 * - pending requests for their documents through household links are declined.
 * If the owner leaves, ownership passes to the longest-standing member; if no
 * one is left, the household is deleted.
 *
 * Runs with the service role because it touches other members' rows (ownership
 * transfer); the caller must pass the signed-in user's own profile id.
 */
export async function leaveHousehold(profileId: string, householdId: string): Promise<boolean> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: membership } = await admin
    .from("household_members")
    .select("id, role")
    .eq("household_id", householdId)
    .eq("profile_id", profileId)
    .eq("status", "accepted")
    .maybeSingle();
  if (!membership) return false;

  await admin.from("household_members").update({ status: "left", role: "member" }).eq("id", membership.id);

  const { data: links } = await admin.from("share_links").select("id, owner_profile_id").eq("household_id", householdId);
  const linkIds = (links ?? []).map((l) => l.id);
  const ownLinkIds = (links ?? []).filter((l) => l.owner_profile_id === profileId).map((l) => l.id);

  if (ownLinkIds.length) {
    await admin.from("share_links").update({ revoked_at: now }).in("id", ownLinkIds).is("revoked_at", null);
  }
  if (linkIds.length) {
    const { data: requests } = await admin.from("access_requests").select("id").in("link_id", linkIds);
    const requestIds = (requests ?? []).map((r) => r.id);
    if (requestIds.length) {
      await admin
        .from("access_grants")
        .update({ revoked_at: now })
        .in("request_id", requestIds)
        .eq("approved_by_profile_id", profileId)
        .is("revoked_at", null);
      await admin
        .from("access_request_documents")
        .update({ decision: "declined", decided_at: now })
        .in("request_id", requestIds)
        .eq("owner_profile_id", profileId)
        .eq("decision", "pending");
    }
  }

  if (membership.role === "owner") {
    const { data: next } = await admin
      .from("household_members")
      .select("id, profile_id")
      .eq("household_id", householdId)
      .eq("status", "accepted")
      .order("joined_at")
      .limit(1)
      .maybeSingle();
    if (next) {
      await admin.from("household_members").update({ role: "owner" }).eq("id", next.id);
      await admin.from("households").update({ owner_profile_id: next.profile_id }).eq("id", householdId);
    } else {
      await admin.from("households").delete().eq("id", householdId);
    }
  }
  return true;
}

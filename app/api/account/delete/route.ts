import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/dal";
import { handle, HttpError, parseJson } from "@/lib/http";
import { leaveHousehold } from "@/lib/households";
import { DOCUMENTS_BUCKET, PHOTOS_BUCKET, createAdminClient } from "@/lib/supabase/admin";

/**
 * Permanently delete the account. Leaves households first (so ownership passes
 * on cleanly), removes every stored file, then deletes the auth user, which
 * cascades to all rows.
 */
export const POST = handle(async (request: Request) => {
  const { supabase, profile } = await requireApiSession();
  const { confirm } = await parseJson(request, z.object({ confirm: z.literal("DELETE") }));
  if (confirm !== "DELETE") throw new HttpError(400, "Confirmation required");

  const admin = createAdminClient();

  const { data: memberships } = await admin
    .from("household_members")
    .select("household_id")
    .eq("profile_id", profile.id)
    .eq("status", "accepted");
  for (const m of memberships ?? []) await leaveHousehold(profile.id, m.household_id);

  for (const bucket of [DOCUMENTS_BUCKET, PHOTOS_BUCKET]) {
    const { data: objects } = await admin.storage.from(bucket).list(profile.user_id, { limit: 1000 });
    const paths = (objects ?? []).map((o) => `${profile.user_id}/${o.name}`);
    if (paths.length) await admin.storage.from(bucket).remove(paths);
  }

  const { error } = await admin.auth.admin.deleteUser(profile.user_id);
  if (error) throw new HttpError(500, "Could not delete account. Please contact support.");

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
});

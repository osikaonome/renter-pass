import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/dal";
import { handle, HttpError, parseJson } from "@/lib/http";
import { detectSensitive } from "@/lib/security/sensitive";
import { profilePatchSchema } from "@/schemas/profile";

export const GET = handle(async () => {
  const { profile } = await requireApiSession();
  return NextResponse.json(profile);
});

/** Autosave endpoint for the profile builder: accepts any subset of fields. */
export const PATCH = handle(async (request: Request) => {
  const { supabase, profile } = await requireApiSession();
  const patch = await parseJson(request, profilePatchSchema);

  // The photo path is set by the photo upload route; only allow clearing or
  // re-setting a path inside the user's own folder.
  if (patch.photo_path && !patch.photo_path.startsWith(`${profile.user_id}/`)) {
    throw new HttpError(400, "Invalid photo");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ ...patch, last_active_at: new Date().toISOString() })
    .eq("id", profile.id)
    .select("*")
    .single();
  if (error) throw new HttpError(400, error.message);

  // Free-text fields are public on the profile, so warn about identifiers.
  const warnings = detectSensitive([data.headline, data.intro, data.pets ?? ""].join("\n"));
  return NextResponse.json({ profile: data, warnings });
});

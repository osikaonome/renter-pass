import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/dal";
import { handle, HttpError, parseJson } from "@/lib/http";
import { settingsSchema } from "@/schemas/profile";

export const PATCH = handle(async (request: Request) => {
  const { supabase, profile } = await requireApiSession();
  const patch = await parseJson(request, settingsSchema);
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", profile.id)
    .select("default_access_hours, notification_prefs")
    .single();
  if (error) throw new HttpError(400, error.message);
  return NextResponse.json(data);
});

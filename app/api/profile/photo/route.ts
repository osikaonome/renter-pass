import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/dal";
import { handle, HttpError, parseJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { PHOTOS_BUCKET, createAdminClient } from "@/lib/supabase/admin";
import { sniffMimeType } from "@/lib/security/file-type";
import { photoUploadUrlSchema } from "@/schemas/document";
import { z } from "zod";

/** Step 1: get a signed URL so the browser uploads straight to storage. */
export const POST = handle(async (request: Request) => {
  const { supabase, profile } = await requireApiSession();
  await rateLimit("uploadPerUser", profile.user_id);
  const { mimeType } = await parseJson(request, photoUploadUrlSchema);

  const ext = mimeType.split("/")[1];
  const path = `${profile.user_id}/photo-${crypto.randomUUID()}.${ext}`;
  const { data, error } = await supabase.storage.from(PHOTOS_BUCKET).createSignedUploadUrl(path);
  if (error) throw new HttpError(500, "Could not start upload");
  return NextResponse.json({ path, token: data.token });
});

/** Step 2: verify the uploaded file and attach it to the profile. */
export const PUT = handle(async (request: Request) => {
  const { supabase, profile } = await requireApiSession();
  const { path } = await parseJson(request, z.object({ path: z.string().max(300) }));
  if (!path.startsWith(`${profile.user_id}/photo-`)) throw new HttpError(400, "Invalid photo");

  const admin = createAdminClient();
  const { data: file } = await admin.storage.from(PHOTOS_BUCKET).download(path);
  if (!file) throw new HttpError(400, "Upload not found");
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const type = sniffMimeType(head);
  if (!type || type === "application/pdf") {
    await admin.storage.from(PHOTOS_BUCKET).remove([path]);
    throw new HttpError(400, "That file isn't a supported image");
  }

  const previous = profile.photo_path;
  const { error } = await supabase.from("profiles").update({ photo_path: path }).eq("id", profile.id);
  if (error) throw new HttpError(400, error.message);
  if (previous && previous !== path) await admin.storage.from(PHOTOS_BUCKET).remove([previous]);

  const { data: signed } = await supabase.storage.from(PHOTOS_BUCKET).createSignedUrl(path, 60 * 10);
  return NextResponse.json({ photoPath: path, photoUrl: signed?.signedUrl ?? null });
});

export const DELETE = handle(async () => {
  const { supabase, profile } = await requireApiSession();
  if (profile.photo_path) {
    await supabase.storage.from(PHOTOS_BUCKET).remove([profile.photo_path]);
    await supabase.from("profiles").update({ photo_path: null }).eq("id", profile.id);
  }
  return NextResponse.json({ ok: true });
});

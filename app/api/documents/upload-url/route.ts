import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/dal";
import { handle, HttpError, parseJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { DOCUMENTS_BUCKET } from "@/lib/supabase/admin";
import { uploadUrlSchema } from "@/schemas/document";

const EXTENSIONS = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

/**
 * Documents bypass Vercel's 4.5 MB body limit by uploading directly from the
 * browser to the private bucket with a one-time signed upload URL. The object
 * name is random; the user's chosen file name is never used in the path.
 */
export const POST = handle(async (request: Request) => {
  const { supabase, profile } = await requireApiSession();
  await rateLimit("uploadPerUser", profile.user_id);
  const { mimeType } = await parseJson(request, uploadUrlSchema);

  const path = `${profile.user_id}/${crypto.randomUUID()}.${EXTENSIONS[mimeType]}`;
  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUploadUrl(path);
  if (error) throw new HttpError(500, "Could not start upload");
  return NextResponse.json({ path, token: data.token });
});

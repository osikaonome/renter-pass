import { NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import { requireApiSession } from "@/lib/dal";
import { handle, HttpError, parseJson } from "@/lib/http";
import { DOCUMENTS_BUCKET, createAdminClient } from "@/lib/supabase/admin";
import { MAX_DOCUMENT_BYTES, sniffMimeType } from "@/lib/security/file-type";
import { detectSensitive } from "@/lib/security/sensitive";
import { registerDocumentSchema } from "@/schemas/document";

export const GET = handle(async () => {
  const { supabase, profile } = await requireApiSession();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("profile_id", profile.id)
    .order("uploaded_at", { ascending: false });
  if (error) throw new HttpError(500, error.message);
  return NextResponse.json(data);
});

/**
 * Called after the browser finishes a direct upload. Verifies the object really
 * is an allowed file type (by magic bytes) and size, scans PDFs for sensitive
 * identifiers, then records it. Rejected uploads are deleted.
 */
export const POST = handle(async (request: Request) => {
  const { supabase, profile } = await requireApiSession();
  const input = await parseJson(request, registerDocumentSchema);
  if (!input.storagePath.startsWith(`${profile.user_id}/`)) throw new HttpError(400, "Invalid upload");

  const admin = createAdminClient();
  const reject = async (message: string) => {
    await admin.storage.from(DOCUMENTS_BUCKET).remove([input.storagePath]);
    throw new HttpError(400, message);
  };

  const { data: file } = await admin.storage.from(DOCUMENTS_BUCKET).download(input.storagePath);
  if (!file) throw new HttpError(400, "Upload not found");
  if (file.size > MAX_DOCUMENT_BYTES) await reject("Files must be 10 MB or smaller");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = sniffMimeType(bytes);
  if (!mimeType) await reject("Only PDF, JPEG, PNG and WebP files are supported");

  let sensitiveFlags: string[] = [];
  if (mimeType === "application/pdf") {
    try {
      const pdf = await getDocumentProxy(bytes.slice());
      const { text } = await extractText(pdf, { mergePages: true });
      sensitiveFlags = detectSensitive(text);
    } catch {
      await reject("This PDF couldn't be read. It may be encrypted or damaged.");
    }
  }

  const row = {
    category: input.category,
    label: input.label,
    storage_path: input.storagePath,
    mime_type: mimeType!,
    size_bytes: bytes.byteLength,
    sensitive_flags: sensitiveFlags,
    uploaded_at: new Date().toISOString(),
  };

  if (input.replacesId) {
    const { data: existing } = await supabase
      .from("documents")
      .select("storage_path")
      .eq("id", input.replacesId)
      .single();
    if (!existing) await reject("Document not found");
    const { data, error } = await supabase
      .from("documents")
      .update(row)
      .eq("id", input.replacesId)
      .select("*")
      .single();
    if (error) await reject(error.message);
    await admin.storage.from(DOCUMENTS_BUCKET).remove([existing!.storage_path]);
    return NextResponse.json(data);
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({ ...row, profile_id: profile.id })
    .select("*")
    .single();
  if (error) await reject(error.message);
  return NextResponse.json(data, { status: 201 });
});

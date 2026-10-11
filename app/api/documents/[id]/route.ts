import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/dal";
import { handle, HttpError, parseJson } from "@/lib/http";
import { DOCUMENTS_BUCKET } from "@/lib/supabase/admin";
import { updateDocumentSchema } from "@/schemas/document";

export const PATCH = handle(async (request: Request, ctx: RouteContext<"/api/documents/[id]">) => {
  const { supabase } = await requireApiSession();
  const { id } = await ctx.params;
  const patch = await parseJson(request, updateDocumentSchema);
  // RLS limits this to the caller's own documents.
  const { data, error } = await supabase.from("documents").update(patch).eq("id", id).select("*").maybeSingle();
  if (error) throw new HttpError(400, error.message);
  if (!data) throw new HttpError(404, "Document not found");
  return NextResponse.json(data);
});

/** Deleting a document also removes any grants for it (cascade). */
export const DELETE = handle(async (_request: Request, ctx: RouteContext<"/api/documents/[id]">) => {
  const { supabase } = await requireApiSession();
  const { id } = await ctx.params;
  const { data, error } = await supabase.from("documents").delete().eq("id", id).select("storage_path").maybeSingle();
  if (error) throw new HttpError(400, error.message);
  if (!data) throw new HttpError(404, "Document not found");
  await supabase.storage.from(DOCUMENTS_BUCKET).remove([data.storage_path]);
  return NextResponse.json({ ok: true });
});

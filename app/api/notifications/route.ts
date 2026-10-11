import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/dal";
import { handle, HttpError, parseJson } from "@/lib/http";

export const GET = handle(async () => {
  const { supabase, profile } = await requireApiSession();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new HttpError(500, error.message);
  return NextResponse.json(data);
});

/** Mark some (or all, when `ids` is omitted) notifications as read. */
export const POST = handle(async (request: Request) => {
  const { supabase, profile } = await requireApiSession();
  const { ids } = await parseJson(request, z.object({ ids: z.array(z.uuid()).max(100).optional() }));
  let query = supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("profile_id", profile.id)
    .is("read_at", null);
  if (ids) query = query.in("id", ids);
  const { error } = await query;
  if (error) throw new HttpError(400, error.message);
  return NextResponse.json({ ok: true });
});

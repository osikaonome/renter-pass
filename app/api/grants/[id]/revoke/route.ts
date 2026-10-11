import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/dal";
import { handle, HttpError } from "@/lib/http";

export const POST = handle(async (_request: Request, ctx: RouteContext<"/api/grants/[id]/revoke">) => {
  const { supabase } = await requireApiSession();
  const { id } = await ctx.params;
  const { data, error } = await supabase
    .from("access_grants")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();
  if (error) throw new HttpError(400, error.message);
  if (!data) throw new HttpError(404, "Access not found or already revoked");
  return NextResponse.json({ ok: true });
});

import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/dal";
import { handle, HttpError } from "@/lib/http";

/** Owner cancels a pending invite. RLS only allows deleting rows still 'invited'. */
export const DELETE = handle(async (_request: Request, ctx: RouteContext<"/api/households/invites/[id]">) => {
  const { supabase } = await requireApiSession();
  const { id } = await ctx.params;
  const { data, error } = await supabase.from("household_members").delete().eq("id", id).select("id").maybeSingle();
  if (error) throw new HttpError(400, error.message);
  if (!data) throw new HttpError(404, "Invite not found");
  return NextResponse.json({ ok: true });
});

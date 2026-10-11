import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/dal";
import { handle, HttpError, parseJson } from "@/lib/http";
import { updateHouseholdSchema } from "@/schemas/household";

/** Owner edits the shared household summary. RLS restricts updates to the owner. */
export const PATCH = handle(async (request: Request, ctx: RouteContext<"/api/households/[id]">) => {
  const { supabase } = await requireApiSession();
  const { id } = await ctx.params;
  const patch = await parseJson(request, updateHouseholdSchema);
  const { data, error } = await supabase.from("households").update(patch).eq("id", id).select("*").maybeSingle();
  if (error) throw new HttpError(400, error.message);
  if (!data) throw new HttpError(403, "Only the household owner can edit the summary");
  return NextResponse.json(data);
});

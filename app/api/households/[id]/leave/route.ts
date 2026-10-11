import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/dal";
import { handle, HttpError } from "@/lib/http";
import { leaveHousehold } from "@/lib/households";

export const POST = handle(async (_request: Request, ctx: RouteContext<"/api/households/[id]/leave">) => {
  const { profile } = await requireApiSession();
  const { id } = await ctx.params;
  const left = await leaveHousehold(profile.id, id);
  if (!left) throw new HttpError(404, "You're not in that household");
  return NextResponse.json({ ok: true });
});

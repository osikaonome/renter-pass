import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/dal";
import { handle, HttpError, parseJson } from "@/lib/http";
import { updateLinkSchema } from "@/schemas/link";

export const GET = handle(async (_request: Request, ctx: RouteContext<"/api/links/[id]">) => {
  const { supabase } = await requireApiSession();
  const { id } = await ctx.params;
  const { data: link } = await supabase.from("share_links").select("*").eq("id", id).maybeSingle();
  if (!link) throw new HttpError(404, "Link not found");

  const [{ data: views }, { data: requests }] = await Promise.all([
    supabase
      .from("link_views")
      .select("viewed_at")
      .eq("link_id", id)
      .order("viewed_at", { ascending: false })
      .limit(200),
    supabase
      .from("access_requests")
      .select("id, requester_name, requester_email, status, created_at, decided_at")
      .eq("link_id", id)
      .order("created_at", { ascending: false }),
  ]);
  return NextResponse.json({ link, views: views ?? [], requests: requests ?? [] });
});

export const PATCH = handle(async (request: Request, ctx: RouteContext<"/api/links/[id]">) => {
  const { supabase } = await requireApiSession();
  const { id } = await ctx.params;
  const { revoked, ...rest } = await parseJson(request, updateLinkSchema);
  const patch = { ...rest, ...(revoked ? { revoked_at: new Date().toISOString() } : {}) };

  const { data, error } = await supabase.from("share_links").update(patch).eq("id", id).select("*").maybeSingle();
  if (error) throw new HttpError(400, error.message);
  if (!data) throw new HttpError(404, "Link not found");

  // Revoking a link also cuts off any documents shared through it.
  if (revoked) {
    const { data: requests } = await supabase.from("access_requests").select("id").eq("link_id", id);
    const ids = (requests ?? []).map((r) => r.id);
    if (ids.length) {
      await supabase
        .from("access_grants")
        .update({ revoked_at: new Date().toISOString() })
        .in("request_id", ids)
        .is("revoked_at", null);
    }
  }
  return NextResponse.json(data);
});

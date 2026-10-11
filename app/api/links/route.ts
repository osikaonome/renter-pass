import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/dal";
import { handle, HttpError, parseJson } from "@/lib/http";
import { generateSlug } from "@/lib/security/tokens";
import { createLinkSchema } from "@/schemas/link";

/** The renter's links with view and pending-request counts for the dashboard. */
export const GET = handle(async () => {
  const { supabase, profile } = await requireApiSession();
  const { data, error } = await supabase
    .from("share_links")
    .select("*, link_views(count), access_requests(status)")
    .eq("owner_profile_id", profile.id)
    .order("created_at", { ascending: false });
  if (error) throw new HttpError(500, error.message);

  return NextResponse.json(
    data.map(({ link_views, access_requests, ...link }) => ({
      ...link,
      view_count: (link_views as { count: number }[])[0]?.count ?? 0,
      pending_requests: (access_requests as { status: string }[]).filter((r) => r.status === "pending").length,
    })),
  );
});

export const POST = handle(async (request: Request) => {
  const { supabase, profile } = await requireApiSession();
  const input = await parseJson(request, createLinkSchema);

  // RLS also enforces membership, but a clear error is friendlier.
  if (input.kind === "household") {
    const { data: member } = await supabase
      .from("household_members")
      .select("id")
      .eq("household_id", input.householdId!)
      .eq("profile_id", profile.id)
      .eq("status", "accepted")
      .maybeSingle();
    if (!member) throw new HttpError(403, "You're not a member of that household");
  }

  const { data, error } = await supabase
    .from("share_links")
    .insert({
      slug: generateSlug(),
      owner_profile_id: profile.id,
      kind: input.kind,
      household_id: input.kind === "household" ? input.householdId : null,
      label: input.label,
      listing_url: input.listingUrl || null,
      listing_text: input.listingText || null,
      message: input.message || null,
    })
    .select("*")
    .single();
  if (error) throw new HttpError(400, error.message);
  return NextResponse.json(data, { status: 201 });
});

import { zipSync, strToU8 } from "fflate";
import { requireApiSession } from "@/lib/dal";
import { handle } from "@/lib/http";
import { DOCUMENTS_BUCKET, PHOTOS_BUCKET } from "@/lib/supabase/admin";

export const maxDuration = 60;

/** GDPR export: everything we hold about the user as JSON, plus their files, in one zip. */
export const GET = handle(async () => {
  const { supabase, profile } = await requireApiSession();

  const [documents, households, links, views, requests, grants, notifications, pushSubs] = await Promise.all([
    supabase.from("documents").select("*").eq("profile_id", profile.id),
    supabase.from("household_members").select("*, households(*)").eq("profile_id", profile.id),
    supabase.from("share_links").select("*").eq("owner_profile_id", profile.id),
    supabase.from("link_views").select("*, share_links!inner(owner_profile_id)").eq("share_links.owner_profile_id", profile.id),
    supabase.from("access_request_documents").select("*, access_requests(*)").eq("owner_profile_id", profile.id),
    supabase.from("access_grants").select("*").eq("approved_by_profile_id", profile.id),
    supabase.from("notifications").select("*").eq("profile_id", profile.id),
    supabase.from("push_subscriptions").select("id, created_at").eq("profile_id", profile.id),
  ]);

  const data = {
    exportedAt: new Date().toISOString(),
    profile,
    documents: documents.data,
    households: households.data,
    links: links.data,
    linkViews: views.data,
    documentRequests: requests.data,
    accessGrants: grants.data,
    notifications: notifications.data,
    pushSubscriptions: pushSubs.data,
  };

  const files: Record<string, Uint8Array> = { "data.json": strToU8(JSON.stringify(data, null, 2)) };
  for (const doc of documents.data ?? []) {
    const { data: blob } = await supabase.storage.from(DOCUMENTS_BUCKET).download(doc.storage_path);
    if (blob) {
      const ext = doc.storage_path.split(".").pop();
      const safeLabel = doc.label.replace(/[^\w\- ]+/g, "").slice(0, 60) || "document";
      files[`documents/${safeLabel}-${doc.id.slice(0, 8)}.${ext}`] = new Uint8Array(await blob.arrayBuffer());
    }
  }
  if (profile.photo_path) {
    const { data: blob } = await supabase.storage.from(PHOTOS_BUCKET).download(profile.photo_path);
    if (blob) files[`photo.${profile.photo_path.split(".").pop()}`] = new Uint8Array(await blob.arrayBuffer());
  }

  const zip = zipSync(files, { level: 6 });
  return new Response(zip, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="renterpass-export-${new Date().toISOString().slice(0, 10)}.zip"`,
      "Cache-Control": "no-store",
    },
  });
});

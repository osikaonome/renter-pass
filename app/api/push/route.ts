import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/dal";
import { handle, HttpError, parseJson } from "@/lib/http";

const subscriptionSchema = z.object({
  endpoint: z.url({ protocol: /^https$/ }).max(1000),
  keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }),
});

export const POST = handle(async (request: Request) => {
  const { supabase, profile } = await requireApiSession();
  const sub = await parseJson(request, subscriptionSchema);
  const { error } = await supabase.from("push_subscriptions").upsert(
    { profile_id: profile.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    { onConflict: "endpoint" },
  );
  if (error) throw new HttpError(400, error.message);
  return NextResponse.json({ ok: true });
});

export const DELETE = handle(async (request: Request) => {
  const { supabase } = await requireApiSession();
  const { endpoint } = await parseJson(request, z.object({ endpoint: z.string().max(1000) }));
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return NextResponse.json({ ok: true });
});

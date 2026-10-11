import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/dal";
import { handle, HttpError, parseJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { chat, type ChatMessage } from "@/lib/ai/openrouter";
import { SYSTEM_PROMPT, firstTurn, householdFacts, profileFacts } from "@/lib/ai/prompts";
import { draftRequestSchema, revisionPrompt } from "@/schemas/ai";

export const maxDuration = 60;

/**
 * Draft (or revise) an application message. The server always rebuilds the
 * system prompt and the facts turn from the database, so the client can't
 * smuggle in other data. Documents are never sent to the model.
 */
export const POST = handle(async (request: Request) => {
  const { supabase, profile } = await requireApiSession();
  await rateLimit("aiDraftPerUser", profile.user_id);
  const input = await parseJson(request, draftRequestSchema);

  let facts = profileFacts(profile);
  if (input.householdId) {
    const [{ data: household }, { data: members }] = await Promise.all([
      supabase
        .from("households")
        .select("name, move_in_date, combined_budget, summary")
        .eq("id", input.householdId)
        .maybeSingle(),
      supabase.rpc("household_member_profiles", { hid: input.householdId }),
    ]);
    if (!household) throw new HttpError(404, "Household not found");
    facts += `\n\nHOUSEHOLD\n${householdFacts(household, members ?? [])}`;
  }

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: firstTurn(facts, input.listingText) },
    // Earlier drafts and follow-up instructions, with reasoning preserved.
    ...input.history,
  ];
  if (input.instruction) {
    messages.push({ role: "user", content: revisionPrompt(input.instruction) });
  }
  if (messages.at(-1)?.role === "assistant") throw new HttpError(400, "Nothing to revise");

  const result = await chat(messages, { userId: profile.id });
  return NextResponse.json(result);
});

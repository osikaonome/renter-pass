import "server-only";
import { env } from "@/lib/env";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  reasoning_details?: Record<string, unknown>[];
};

export type ChatResult = { content: string; reasoning_details?: Record<string, unknown>[] };

/**
 * Minimal OpenRouter chat call with reasoning enabled. `reasoning_details` from
 * the response must be passed back on the assistant message in follow-up turns
 * so the model can continue from its earlier reasoning.
 */
export async function chat(messages: ChatMessage[], { userId }: { userId: string }): Promise<ChatResult> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openRouterApiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": env.siteUrl,
      "X-Title": "RenterPass",
    },
    body: JSON.stringify({
      model: env.openRouterModel,
      messages,
      reasoning: { effort: "medium" },
      max_tokens: 2000,
      temperature: 0.7,
      // Production: only route to providers that don't retain or train on prompts.
      provider: { data_collection: "deny", zdr: true },
      // Opaque, non-identifying id for provider-side abuse monitoring.
      user: userId,
    }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) {
    console.error("OpenRouter error", response.status, await response.text().catch(() => ""));
    throw new Error("AI drafting is unavailable right now");
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string; reasoning_details?: Record<string, unknown>[] } }[];
  };
  const message = json.choices?.[0]?.message;
  if (!message?.content) throw new Error("AI returned an empty draft");
  return { content: message.content.trim(), reasoning_details: message.reasoning_details };
}

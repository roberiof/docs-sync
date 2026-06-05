import "server-only";

import OpenAI from "openai";

/**
 * AI client — NVIDIA NIM. NIM exposes an OpenAI-compatible API, so we reuse the
 * OpenAI SDK and point `baseURL` at NIM. The key is server-only — this module
 * is guarded by `server-only` and must never be imported from a client file.
 *
 * Provider-neutral on purpose: swapping providers means changing only the
 * `baseURL`, model, and env var here (OpenAI-compatible: xAI, Together, etc.).
 * Moving to Claude means swapping in `@anthropic-ai/sdk` and adding
 * `cache_control`. The `suggest()` contract stays the same either way.
 */
const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

// Free-tier model on NVIDIA NIM. Verify the current id in the NIM catalog
// (model ids shift) — https://build.nvidia.com.
const MODEL = "meta/llama-3.3-70b-instruct";

export const AI_ACTIONS = ["improve", "summarize", "continue"] as const;
export type AiAction = (typeof AI_ACTIONS)[number];

const SYSTEM_PROMPTS: Record<AiAction, string> = {
  improve:
    "You are an editing assistant. Rewrite the user's text to be clearer and more " +
    "concise while preserving its meaning, tone, and language. Reply with the rewritten " +
    "text only — no preamble, no quotes, no explanation.",
  summarize:
    "You are a summarizing assistant. Write a short, faithful summary of the user's text " +
    "in the same language. Reply with the summary only — no preamble, no quotes, no explanation.",
  continue:
    "You are a writing assistant. Continue the user's text naturally, matching its tone, " +
    "style, and language. Reply with the continuation only (do not repeat the input) — " +
    "no preamble, no quotes, no explanation.",
};

const MAX_TOKENS = 1024;

export async function suggest({
  action,
  text,
}: {
  action: AiAction;
  text: string;
}): Promise<string> {
  const completion = await client.chat.completions.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: "system", content: SYSTEM_PROMPTS[action] },
      { role: "user", content: text },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
}

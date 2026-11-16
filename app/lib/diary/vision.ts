// Claude reads one screenshot. The image is never stored or logged.
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { EXTRACTION_SCHEMA, parseExtraction } from "./screenshot";

const PROMPT = `You read one screenshot for Callum's work diary (UK, Europe/London).
Decide: "fixed" = an appointment/event at a set date and time he must attend or that keeps him away;
"task" = something he must do; "info" = nothing to schedule.
Title: 3-6 words. For "fixed" never include people's names, phone numbers, emails, addresses or
message text - describe it generically (e.g. "Partner nails, driving", "Dentist").
Never guess a date or time that is not visible: use null and add a short question instead.
If no year is shown, use the next occurrence on or after today. Times as 24h HH:MM.`;

export async function readScreenshot(b64: string, mediaType: "image/jpeg" | "image/png" | "image/webp", todayLabel: string) {
  try {
    const client = new Anthropic();
    const res = await client.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      system: PROMPT,
      output_config: { effort: "low", format: { type: "json_schema", schema: EXTRACTION_SCHEMA as unknown as Record<string, unknown> } },
      messages: [{ role: "user", content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data: b64 } },
        { type: "text", text: `Today is ${todayLabel}. Extract the item.` },
      ] }],
    });
    if (res.stop_reason === "refusal") return { ok: false as const, error: "Couldn't read that screenshot — type it instead." };
    const text = res.content.find((b) => b.type === "text");
    return parseExtraction(text && text.type === "text" ? text.text : undefined);
  } catch (e) {
    if (e instanceof Anthropic.APIError) return { ok: false as const, error: `Screenshot reader unavailable (${e.status ?? "network"}). Type it instead.` };
    return { ok: false as const, error: "Screenshot reader unavailable. Type it instead." };
  }
}

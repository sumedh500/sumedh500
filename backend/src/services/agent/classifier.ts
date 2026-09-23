import { getGroqClient, withGroqFallback } from "./groqClient";
import type { ChatMessage, StageClassification } from "../../types/agent";
import type { StageId } from "../../types";
import type { ChatCompletionCreateParamsNonStreaming } from "groq-sdk/resources/chat/completions";

// groq-sdk 0.9.1's types predate the reasoning-model `reasoning_effort`
// param (openai/gpt-oss-* on Groq). The API accepts it regardless — this
// just widens the request type so we can pass it without an `any` cast.
type GroqRequestWithReasoning = ChatCompletionCreateParamsNonStreaming & {
  reasoning_effort?: "low" | "medium" | "high";
};

const STAGES: StageId[] = ["new_lead", "ongoing_pipeline", "booked_vehicle", "post_purchase"];

const CLASSIFIER_INSTRUCTIONS = `You classify which customer lifecycle stage a car dealership chat message
belongs to. Respond with ONLY a JSON object, no other text, no markdown.

Stages:
- new_lead: an unidentified visitor asking about models, pricing, features, or wanting a test drive.
- ongoing_pipeline: a known prospect checking the status of an existing test drive or quotation, using a phone number or Deal ID.
- booked_vehicle: a customer who has already paid a booking amount, asking about delivery timeline, VIN, allocation status, or payment link, using a Booking ID or phone number.
- post_purchase: an existing owner logging a complaint or booking a service appointment (registration number, odometer, issue type, service center).`;

function buildUserPrompt(messages: ChatMessage[], currentStage: StageId | null): string {
  const recent = messages
    .slice(-6)
    .map((m) => `${m.role}: ${typeof m.content === "string" ? m.content : ""}`)
    .join("\n");

  const priorNote = currentStage
    ? `The conversation is currently in stage "${currentStage}". Only switch away from it if the ` +
      `latest message clearly indicates a different stage — otherwise return "continue".`
    : "This is a new conversation with no stage yet — pick the best-fitting stage.";

  const stageOptions = currentStage ? [...STAGES, "continue"] : STAGES;

  return (
    `${priorNote}\n\nConversation so far:\n${recent}\n\n` +
    `Output JSON exactly like: {"stage": "<one of: ${stageOptions.join(", ")}>", "confidence": <0 to 1>}`
  );
}

export async function classifyStage(messages: ChatMessage[], currentStage: StageId | null): Promise<StageClassification> {
  const client = getGroqClient();

  const buildRequest = (model: string): GroqRequestWithReasoning => ({
    model,
    messages: [
      { role: "system", content: CLASSIFIER_INSTRUCTIONS },
      { role: "user", content: buildUserPrompt(messages, currentStage) },
    ],
    response_format: { type: "json_object" },
    temperature: 0,
    // Reasoning models (openai/gpt-oss-* on Groq) spend part of max_tokens
    // on a hidden chain-of-thought before the final JSON — 100 was enough
    // for the answer alone but not the reasoning ahead of it, so this call
    // was hitting json_validate_failed. Classification is a simple
    // categorization task that doesn't need deep reasoning, so effort is
    // set to "low" to keep both latency and the reasoning-token spend down.
    max_tokens: 1024,
    reasoning_effort: "low",
  });

  const response = await withGroqFallback((model) => client.chat.completions.create(buildRequest(model)));

  const raw = response.choices[0]?.message?.content ?? "{}";
  const classification = parseClassification(raw, currentStage);

  console.log(
    `[stage-classifier] prior=${currentStage ?? "none"} -> stage=${classification.stage} (confidence=${classification.confidence})`
  );

  return classification;
}

function parseClassification(raw: string, currentStage: StageId | null): StageClassification {
  try {
    const parsed = JSON.parse(raw) as { stage?: string; confidence?: number };
    const stage = parsed.stage === "continue" ? currentStage : parsed.stage;

    if (!stage || !STAGES.includes(stage as StageId)) {
      throw new Error(`Unrecognized stage "${parsed.stage}"`);
    }

    return {
      stage: stage as StageId,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
    };
  } catch {
    // Model didn't return valid/expected JSON — never crash the turn over a
    // malformed classification. Fall back to the sticky prior stage, or
    // new_lead if this is the very first message in the conversation.
    return { stage: currentStage ?? "new_lead", confidence: 0 };
  }
}

import { classifyStage } from "./classifier";
import { buildSystemPrompt } from "./systemPrompt";
import { runToolLoop } from "./toolLoop";
import { getToolDefinitionsForStage } from "../tools/toolRegistry";
import type { AgentTurnInput, AgentTurnResult, ChatMessage } from "../../types/agent";

// The two-call design from ARCHITECTURE.md §3: classify the stage first
// (cheap, no tools), then run the response/tool-calling loop with only
// that stage's tools available. Stateless — the caller (Phase 4's
// controller, backed by Redis in Phase 6) owns persisting `messages` and
// `currentStage` between turns; this function doesn't read or write any
// session store itself.
export async function runAgentTurn(input: AgentTurnInput): Promise<AgentTurnResult> {
  const classification = await classifyStage(input.messages, input.currentStage);
  const stage = classification.stage;

  const systemMessage: ChatMessage = { role: "system", content: buildSystemPrompt(stage) };
  const messagesWithSystemPrompt: ChatMessage[] = [systemMessage, ...input.messages];
  const tools = getToolDefinitionsForStage(stage);

  const { reply, toolCallLog, messages } = await runToolLoop({
    messages: messagesWithSystemPrompt,
    tools,
    stage,
  });

  return {
    reply,
    stage,
    toolCallLog,
    // Strip the system prompt back out — it's rebuilt fresh (and could
    // change stage) on the next turn, so it shouldn't accumulate in the
    // persisted history.
    messages: messages.filter((message) => message.role !== "system"),
  };
}

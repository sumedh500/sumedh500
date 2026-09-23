import { getGroqClient, withGroqFallback } from "./groqClient";
import { executeTool } from "../tools/toolRegistry";
import type { ChatMessage, ToolCallLogEntry, ToolDefinition } from "../../types/agent";
import type { StageId } from "../../types";

// Caps how many times the model can call a tool before we force a final
// reply — protects against a confused model looping forever on repeated
// failed calls.
const MAX_ITERATIONS = 4;

const FALLBACK_REPLY =
  "I'm having trouble completing that right now — could you try rephrasing, or I can connect you with someone from the team?";

export async function runToolLoop(params: {
  messages: ChatMessage[]; // must include the stage system prompt as the first message
  tools: ToolDefinition[];
  stage: StageId;
}): Promise<{ reply: string; toolCallLog: ToolCallLogEntry[]; messages: ChatMessage[] }> {
  const client = getGroqClient();
  const workingMessages: ChatMessage[] = [...params.messages];
  const toolCallLog: ToolCallLogEntry[] = [];

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const response = await withGroqFallback((model) =>
      client.chat.completions.create({
        model,
        messages: workingMessages,
        tools: params.tools,
        tool_choice: "auto",
        temperature: 0.3,
      })
    );

    const message = response.choices[0]?.message;
    if (!message) {
      throw new Error("Groq returned no message");
    }

    const toolCalls = message.tool_calls ?? [];

    if (toolCalls.length === 0) {
      const reply = message.content ?? "";
      workingMessages.push({ role: "assistant", content: reply });
      return { reply, toolCallLog, messages: workingMessages };
    }

    workingMessages.push({
      role: "assistant",
      content: message.content ?? null,
      tool_calls: toolCalls,
    });

    for (const toolCall of toolCalls) {
      const args = safeParseArgs(toolCall.function.arguments);
      const result = await executeTool(toolCall.function.name, args);

      toolCallLog.push({ stage: params.stage, toolName: toolCall.function.name, args, result });

      workingMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }
  }

  workingMessages.push({ role: "assistant", content: FALLBACK_REPLY });
  return { reply: FALLBACK_REPLY, toolCallLog, messages: workingMessages };
}

function safeParseArgs(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

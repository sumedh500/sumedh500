import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "groq-sdk/resources/chat/completions";
import type { StageId } from "./index";

// Reuse the Groq SDK's own message/tool shapes instead of hand-rolling
// slightly-incompatible duplicates — the whole point of calling Groq
// directly (no LangChain) is to keep this boundary exact.
export type ChatMessage = ChatCompletionMessageParam;
export type ToolDefinition = ChatCompletionTool;

export interface ToolExecutionResult {
  ok: boolean;
  data?: unknown;
  error?: string;
}

export interface AgentTurnInput {
  messages: ChatMessage[]; // conversation so far (user/assistant/tool turns), no system prompt — agentService adds it
  currentStage: StageId | null;
}

export interface ToolCallLogEntry {
  stage: StageId;
  toolName: string;
  args: unknown;
  result: ToolExecutionResult;
}

export interface AgentTurnResult {
  reply: string;
  stage: StageId;
  toolCallLog: ToolCallLogEntry[];
  messages: ChatMessage[]; // updated history (system prompt stripped back out) — caller persists this
}

export interface StageClassification {
  stage: StageId;
  confidence: number;
}

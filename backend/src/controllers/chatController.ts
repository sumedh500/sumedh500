import type { Request, Response } from "express";
import { z } from "zod";
import { runAgentTurn } from "../services/agent";
import { getOrCreateSession, updateSession } from "../services/session";
import type { ChatMessage } from "../types/agent";

const chatRequestSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1).max(2000),
});

export async function postChat(req: Request, res: Response): Promise<void> {
  const { sessionId, message } = chatRequestSchema.parse(req.body);

  const session = getOrCreateSession(sessionId);
  const messages: ChatMessage[] = [...session.messages, { role: "user", content: message }];

  const result = await runAgentTurn({ messages, currentStage: session.stage });

  updateSession(sessionId, { stage: result.stage, messages: result.messages });

  res.json({
    sessionId,
    reply: result.reply,
    stage: result.stage,
    toolCalls: result.toolCallLog,
  });
}

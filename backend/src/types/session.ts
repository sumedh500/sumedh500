import type { ChatMessage } from "./agent";
import type { StageId } from "./index";

export interface Session {
  sessionId: string;
  stage: StageId | null;
  messages: ChatMessage[];
  createdAt: number;
  lastActiveAt: number;
}

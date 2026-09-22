// Interactive CLI harness for the Phase 3 agent core — lets you exercise
// classify -> tool-call -> reply against real Groq without waiting for
// Phase 4's HTTP layer. Not part of the app itself.
//
// Usage: npm run test:agent   (from backend/)
// Requires GROQ_API_KEY in backend/.env, and ZOHO_* if you want to test a
// stage that actually calls Zoho (new_lead/ongoing_pipeline/booked_vehicle/post_purchase all do).

import "dotenv/config";
import readline from "node:readline";
import { runAgentTurn } from "../src/services/agent/agentService";
import type { ChatMessage } from "../src/types/agent";
import type { StageId } from "../src/types";

async function main() {
  console.log("Chat agent test harness. Type a message and press Enter. Type 'exit' to quit.\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = () => new Promise<string>((resolve) => rl.question("you> ", resolve));

  let messages: ChatMessage[] = [];
  let currentStage: StageId | null = null;

  for (;;) {
    const userInput = await ask();
    if (userInput.trim().toLowerCase() === "exit") break;

    messages.push({ role: "user", content: userInput });

    const result = await runAgentTurn({ messages, currentStage });

    console.log(`\n[stage: ${result.stage}]`);
    for (const call of result.toolCallLog) {
      console.log(`[tool call] ${call.toolName}(${JSON.stringify(call.args)}) ->`, JSON.stringify(call.result));
    }
    console.log(`agent> ${result.reply}\n`);

    messages = result.messages;
    currentStage = result.stage;
  }

  rl.close();
}

main().catch((error) => {
  console.error("Agent test failed:", error.response?.data ?? error.message ?? error);
  process.exit(1);
});

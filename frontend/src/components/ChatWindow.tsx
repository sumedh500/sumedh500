import { useEffect, useRef, useState } from "react";
import { useSession } from "../hooks/useSession";
import { sendChatMessage } from "../api/chatApi";
import type { StageId, UiMessage } from "../types";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { StageIndicator } from "./StageIndicator";
import { SuggestionCards } from "./SuggestionCards";

export function ChatWindow() {
  const { sessionId, startNewSession } = useSession();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [stage, setStage] = useState<StageId | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  async function handleSend(text: string, demoHint?: string) {
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsSending(true);
    setError(null);

    try {
      const response = await sendChatMessage(sessionId, text);
      setMessages((prev) => {
        const next: UiMessage[] = [...prev, { role: "assistant", content: response.reply }];
        // Shown once, right after the first real reply, so it reads as
        // "here's how to actually see this work" rather than interrupting
        // the assistant's own answer.
        if (demoHint) {
          next.push({ role: "hint", content: demoHint });
        }
        return next;
      });
      setStage(response.stage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  function handleNewChat() {
    startNewSession();
    setMessages([]);
    setStage(null);
    setError(null);
  }

  return (
    <div className="chat-page">
      <div className="chat-window">
        <header className="chat-header">
          <div className="chat-header__title">
            <span className="chat-header__logo">OEM</span>
            <h1>Chat Assistant</h1>
          </div>

          <div className="chat-header__actions">
            {messages.length > 0 && (
              <button type="button" className="new-chat-button" onClick={handleNewChat}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                New chat
              </button>
            )}
            <StageIndicator stage={stage} />
          </div>
        </header>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <SuggestionCards onSelect={handleSend} />
          ) : (
            messages.map((message, index) => <MessageBubble key={index} message={message} />)
          )}
          {isSending && <MessageBubble message={{ role: "assistant", content: "" }} pending />}
          <div ref={messagesEndRef} />
        </div>

        {error && <p className="chat-error">{error}</p>}

        <ChatInput onSend={handleSend} disabled={isSending} />
      </div>
    </div>
  );
}

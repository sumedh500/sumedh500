import { useEffect, useRef, useState } from "react";
import { useSession } from "../hooks/useSession";
import { sendChatMessage } from "../api/chatApi";
import type { StageId, UiMessage } from "../types";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { StageIndicator } from "./StageIndicator";
import { SuggestionCards } from "./SuggestionCards";

export function ChatWindow() {
  const sessionId = useSession();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [stage, setStage] = useState<StageId | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  async function handleSend(text: string) {
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsSending(true);
    setError(null);

    try {
      const response = await sendChatMessage(sessionId, text);
      setMessages((prev) => [...prev, { role: "assistant", content: response.reply }]);
      setStage(response.stage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="chat-page">
      <div className="chat-window">
        <header className="chat-header">
          <div className="chat-header__title">
            <span className="chat-header__logo">OEM</span>
            <h1>Chat Assistant</h1>
          </div>
          <StageIndicator stage={stage} />
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

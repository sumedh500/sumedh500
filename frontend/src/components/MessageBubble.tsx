import type { UiMessage } from "../types";

interface MessageBubbleProps {
  message: UiMessage;
  pending?: boolean;
}

export function MessageBubble({ message, pending }: MessageBubbleProps) {
  return (
    <div className={`message-bubble message-bubble--${message.role}${pending ? " message-bubble--pending" : ""}`}>
      <span className="message-bubble__role">{message.role === "user" ? "You" : "Assistant"}</span>
      <p className="message-bubble__content">{message.content}</p>
    </div>
  );
}

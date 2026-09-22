import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { UiMessage } from "../types";

interface MessageBubbleProps {
  message: UiMessage;
  pending?: boolean;
}

// The model sometimes writes literal <br> tags inside table cells (a common
// LLM habit for multi-line cell content). We deliberately don't enable
// raw-HTML rendering in ReactMarkdown to render those — this content
// ultimately originates from an LLM (and could echo CRM field values back),
// so there's no reason to open up arbitrary HTML/script rendering just to
// support one tag. Converting it to a real Markdown line break first gets
// the same visual result without that risk.
function normalizeContent(content: string): string {
  return content.replace(/<br\s*\/?>/gi, "  \n");
}

export function MessageBubble({ message, pending }: MessageBubbleProps) {
  return (
    <div className={`message-bubble message-bubble--${message.role}${pending ? " message-bubble--pending" : ""}`}>
      <span className="message-bubble__role">{message.role === "user" ? "You" : "Assistant"}</span>
      {message.role === "assistant" ? (
        <div className="message-bubble__content message-bubble__content--markdown">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              table: ({ children }) => (
                <div className="md-table-wrap">
                  <table>{children}</table>
                </div>
              ),
            }}
          >
            {normalizeContent(message.content)}
          </ReactMarkdown>
        </div>
      ) : (
        <p className="message-bubble__content message-bubble__content--plain">{message.content}</p>
      )}
    </div>
  );
}

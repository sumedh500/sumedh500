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

function Avatar({ role }: { role: UiMessage["role"] }) {
  return (
    <span className={`avatar avatar--${role}`} aria-hidden="true">
      {role === "user" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      )}
    </span>
  );
}

export function MessageBubble({ message, pending }: MessageBubbleProps) {
  return (
    <div className={`message-row message-row--${message.role}`}>
      {message.role === "assistant" && <Avatar role="assistant" />}

      <div className={`message-bubble message-bubble--${message.role}${pending ? " message-bubble--pending" : ""}`}>
        {pending ? (
          <span className="typing-indicator" aria-label="Assistant is typing">
            <span />
            <span />
            <span />
          </span>
        ) : message.role === "assistant" ? (
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

      {message.role === "user" && <Avatar role="user" />}
    </div>
  );
}

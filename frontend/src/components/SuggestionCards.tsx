import type { ReactElement } from "react";

interface Suggestion {
  icon: ReactElement;
  label: string;
  message: string;
}

const ICON_PROPS = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const SUGGESTIONS: Suggestion[] = [
  {
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
    label: "Explore a vehicle",
    message: "Hi, I'm interested in the XUV700. Can you tell me more about it?",
  },
  {
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </svg>
    ),
    label: "Check quotation status",
    message: "Can you check the status of my test drive or quotation?",
  },
  {
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    label: "Track my delivery",
    message: "I want to check the delivery status of my booking.",
  },
  {
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    label: "Book a service",
    message: "I'd like to book a service appointment for my vehicle.",
  },
];

interface SuggestionCardsProps {
  onSelect: (message: string) => void;
}

export function SuggestionCards({ onSelect }: SuggestionCardsProps) {
  return (
    <div className="suggestions">
      <p className="suggestions__greeting">How can I help you today?</p>
      <div className="suggestions__grid">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion.label}
            type="button"
            className="suggestion-card"
            onClick={() => onSelect(suggestion.message)}
          >
            <span className="suggestion-card__icon">{suggestion.icon}</span>
            <span className="suggestion-card__label">{suggestion.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

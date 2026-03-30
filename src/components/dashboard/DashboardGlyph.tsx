interface DashboardGlyphProps {
  name: "receive" | "withdraw" | "profile" | "history" | "incoming" | "growth" | "wallet";
  className?: string;
}

const DashboardGlyph = ({ name, className = "h-5 w-5" }: DashboardGlyphProps) => {
  const commonProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  switch (name) {
    case "receive":
      return (
        <svg {...commonProps}>
          <path d="M12 4v11" />
          <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
          <rect x="4" y="17" width="16" height="3" rx="1.5" />
        </svg>
      );
    case "withdraw":
      return (
        <svg {...commonProps}>
          <path d="M12 20V9" />
          <path d="m16.5 13.5-4.5-4.5-4.5 4.5" />
          <rect x="4" y="4" width="16" height="3" rx="1.5" />
        </svg>
      );
    case "profile":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="8" r="3.25" />
          <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
        </svg>
      );
    case "history":
      return (
        <svg {...commonProps}>
          <path d="M4 12a8 8 0 1 0 2.35-5.65" />
          <path d="M4 5v3.5h3.5" />
          <path d="M12 8v4l2.5 2.5" />
        </svg>
      );
    case "incoming":
      return (
        <svg {...commonProps}>
          <rect x="4" y="5" width="16" height="14" rx="4" />
          <path d="M12 8v8" />
          <path d="m8.5 12 3.5 3.5L15.5 12" />
        </svg>
      );
    case "growth":
      return (
        <svg {...commonProps}>
          <path d="M5 18h14" />
          <path d="M7 15.5 10.5 12l2.5 2.5L18 9.5" />
          <path d="M14.5 9.5H18V13" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...commonProps}>
          <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 15.5z" />
          <path d="M4 9h16" />
          <circle cx="16.5" cy="13.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
  }
};

export default DashboardGlyph;
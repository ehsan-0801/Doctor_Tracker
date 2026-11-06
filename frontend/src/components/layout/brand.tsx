import { cn } from "@/lib/utils";

/**
 * DocTrack mark: a "D" whose bowl carries a heartbeat line that ends in a
 * tracking dot — a doctor, a pulse, and live tracking in one shape
 * (slate tile, coral dot; inverted on dark surfaces).
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-9 shrink-0", className)} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--logo-bg, var(--primary))" />
      <path d="M9.5 7.5h6a8.5 8.5 0 0 1 0 17h-6z" fill="none" stroke="var(--logo-ink, #fff)" strokeWidth="2.4" strokeLinejoin="round" />
      <path
        d="M9.5 16.5h3l1.6-4 2.8 7.5 1.9-3.5h2.4"
        fill="none"
        stroke="var(--logo-ink, #fff)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="23.4" cy="16.5" r="2.1" fill="var(--brand-dot)" stroke="var(--logo-bg, var(--primary))" strokeWidth="1" />
    </svg>
  );
}

export function Brand({
  compact = false,
  inverted = false,
  className,
}: {
  compact?: boolean;
  /** Light text for dark backgrounds (sidebar, footer). */
  inverted?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center gap-2.5", className)}
      // On dark surfaces whose colour matches the logo tile (e.g. the slate site footer), invert the tile.
      style={inverted ? ({ "--logo-bg": "var(--brand-dot)", "--logo-ink": "var(--sidebar)" } as React.CSSProperties) : undefined}
    >
      <LogoMark />
      {!compact && (
        <span className={cn("text-[17px] font-bold tracking-tight", inverted ? "text-white" : "text-foreground")}>
          Doc<span className={inverted ? "text-[var(--brand-dot)]" : "text-[var(--brand-word,var(--primary))]"}>Track</span>
        </span>
      )}
    </div>
  );
}

import { STATUS_COLORS, STATUS_LABELS, type PresenceStatus } from "@/types/tracking";
import { cn } from "@/lib/utils";

/** Status with a coloured dot plus text (never colour alone). */
export function StatusBadge({ status, className }: { status: PresenceStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap", className)}>
      <span className="size-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  );
}

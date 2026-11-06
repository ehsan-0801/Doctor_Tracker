import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export function DoctorAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground", className)}
    >
      {initials(name)}
    </span>
  );
}

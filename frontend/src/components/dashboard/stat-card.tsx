import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function StatCard({
  label,
  value,
  icon: Icon,
  footnote,
  loading,
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  footnote?: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="size-[22px]" aria-hidden />
        </span>
      </div>
      {loading ? (
        <>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3.5 w-36" />
        </>
      ) : (
        <>
          <p className="text-[28px] leading-none font-semibold tracking-tight tabular-nums">{value}</p>
          {footnote && <p className="text-xs text-muted-foreground">{footnote}</p>}
        </>
      )}
    </div>
  );
}

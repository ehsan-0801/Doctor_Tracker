import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { cn } from "@/lib/utils";

/** Shared chrome for charts: title, loading/empty/error states, and an accessible data table. */
export function ChartCard({
  title,
  description,
  loading,
  error,
  onRetry,
  isEmpty,
  emptyText,
  table,
  children,
  className,
  action,
}: {
  /** Control shown in the card header, e.g. a period selector. */
  action?: React.ReactNode;
  title: string;
  description: string;
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  isEmpty: boolean;
  emptyText: string;
  /** Rows for the screen-reader table view: [label, value]. */
  table: { caption: string; headers: [string, string]; rows: [string, string | number][] };
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col rounded-xl border bg-card", className)} aria-labelledby={`${title}-title`}>
      <header className="flex items-start justify-between gap-3 border-b px-5 py-4">
        <div className="min-w-0 space-y-0.5">
          <h2 id={`${title}-title`} className="text-base font-semibold">
            {title}
          </h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {action}
      </header>
      <div className="flex-1 p-4 sm:p-5">
        {loading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : error ? (
          <ErrorState message={error.message} onRetry={onRetry} />
        ) : isEmpty ? (
          <EmptyState title="No data yet" description={emptyText} />
        ) : (
          <>
            <div aria-hidden>{children}</div>
            <table className="sr-only">
              <caption>{table.caption}</caption>
              <thead>
                <tr>
                  <th scope="col">{table.headers[0]}</th>
                  <th scope="col">{table.headers[1]}</th>
                </tr>
              </thead>
              <tbody>
                {table.rows.map(([label, value]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </section>
  );
}

export function ChartTooltip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground">{label}</p>
      <p className="mt-0.5 text-muted-foreground">{value}</p>
    </div>
  );
}

export const CHART = {
  mark: "var(--chart-1)",
  grid: "var(--border)",
  axis: "var(--muted-foreground)",
  font: 12,
} as const;

"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import { ScrollText } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AccessDenied } from "@/components/shared/access-denied";
import { DataTable, type Column } from "@/components/shared/data-table";
import { DateRangeFilter } from "@/components/shared/date-range-filter";
import { FilterBar } from "@/components/shared/filter-bar";
import { FilterSelect } from "@/components/shared/filter-select";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSession } from "@/hooks/use-session";
import { filterState, useUrlFilters } from "@/hooks/use-url-filters";
import { auditApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { ROLE_LABELS } from "@/lib/permissions";
import { useRealtime } from "@/lib/realtime";
import { cn } from "@/lib/utils";
import { actionLabel, type AuditEntry } from "@/types/audit";

const FILTER_KEYS = ["search", "action", "entityType", "startDate", "endDate"] as const;
const tone = (action: string) =>
  action.endsWith("delete") || action.endsWith("deactivate") || action === "auth.login_failed"
    ? "border-destructive/30 bg-destructive/10 text-destructive"
    : action.startsWith("auth.")
      ? "bg-muted text-muted-foreground"
      : "bg-accent text-accent-foreground";

const formatValue = (value: unknown) => (value === null ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value));

export function AuditView() {
  const session = useSession();
  const allowed = session.can("audit:read");
  const { status } = useRealtime();
  const { values, page, setFilters } = useUrlFilters(FILTER_KEYS);
  const { hasFilters, panelCount, clear } = filterState(values, FILTER_KEYS, setFilters);
  const [selected, setSelected] = useState<AuditEntry | null>(null);

  const params = { page, ...values };
  const entries = useQuery({ queryKey: queryKeys.audit.list(params), queryFn: () => auditApi.list(params), placeholderData: keepPreviousData, enabled: allowed });
  const facets = useQuery({ queryKey: queryKeys.audit.facets, queryFn: auditApi.facets, enabled: allowed, staleTime: 60_000 });

  if (!session.isLoading && !allowed) return <AccessDenied />;

  const columns: Column<AuditEntry>[] = [
    { id: "time", header: "Time", cell: (e) => <span className="whitespace-nowrap text-muted-foreground tabular-nums">{format(new Date(e.createdAt), "d MMM yyyy, HH:mm:ss")}</span> },
    {
      id: "actor",
      header: "Who",
      cell: (e) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{e.actorName || "Unknown visitor"}</p>
          <p className="text-xs text-muted-foreground">{e.actorRole ? ROLE_LABELS[e.actorRole] : "Not signed in"}</p>
        </div>
      ),
    },
    { id: "action", header: "Action", cell: (e) => <Badge variant="outline" className={cn("font-normal", tone(e.action))}>{actionLabel(e.action)}</Badge> },
    {
      id: "entity",
      header: "Target",
      cell: (e) => (
        <div className="min-w-0">
          <p className="max-w-[240px] truncate">{e.entityLabel || "—"}</p>
          <p className="text-xs text-muted-foreground capitalize">{e.entityType}</p>
        </div>
      ),
    },
    { id: "ip", header: "IP address", cell: (e) => <span className="font-mono text-xs text-muted-foreground">{e.ip || "—"}</span>, className: "hidden xl:table-cell", headerClassName: "hidden xl:table-cell" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit log"
        description="Every sign-in and change across DocTrack, kept for 180 days."
        actions={
          <span className="inline-flex h-10 items-center gap-2 rounded-lg border bg-card px-3 text-sm text-muted-foreground" aria-live="polite">
            <span className={cn("size-2 rounded-full", status === "live" ? "bg-success" : "bg-muted-foreground/50")} aria-hidden />
            {status === "live" ? "Live updates" : "Reconnecting…"}
          </span>
        }
      />
      <section className="overflow-hidden rounded-xl border bg-card" aria-label="Audit entries">
        <FilterBar
          search={<SearchInput label="Search the audit log" placeholder="Search by person, target or action…" value={values.search} onSearch={(search) => setFilters({ search })} />}
          activeCount={panelCount}
          canClear={hasFilters}
          onClear={clear}
        >
          <FilterSelect
            id="audit-action"
            label="Action"
            allLabel="All actions"
            value={values.action}
            onChange={(action) => setFilters({ action })}
            options={(facets.data?.actions ?? []).map((a) => ({ value: a, label: actionLabel(a) }))}
          />
          <FilterSelect
            id="audit-entity"
            label="Area"
            allLabel="All areas"
            value={values.entityType}
            onChange={(entityType) => setFilters({ entityType })}
            options={(facets.data?.entityTypes ?? []).map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
          />
          <DateRangeFilter id="audit-date" label="Date" startDate={values.startDate} endDate={values.endDate} onChange={(range) => setFilters(range)} />
        </FilterBar>
        <DataTable
          caption="Audit entries"
          columns={[...columns, { id: "open", header: <span className="sr-only">Details</span>, className: "w-24 text-right", cell: (e) => (
            <button type="button" onClick={() => setSelected(e)} className="text-sm font-medium text-link hover:underline">
              Details
            </button>
          ) }]}
          rows={entries.data?.data}
          getRowId={(e) => e._id}
          isLoading={entries.isLoading || session.isLoading}
          isFetching={entries.isFetching}
          error={entries.error}
          onRetry={() => entries.refetch()}
          renderMobileCard={(e) => (
            <button type="button" onClick={() => setSelected(e)} className="w-full space-y-1 text-left">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className={cn("font-normal", tone(e.action))}>{actionLabel(e.action)}</Badge>
                <span className="text-xs text-muted-foreground">{format(new Date(e.createdAt), "d MMM, HH:mm")}</span>
              </div>
              <p className="text-sm font-medium">{e.actorName || "Unknown visitor"}</p>
              <p className="truncate text-xs text-muted-foreground">{e.entityLabel || e.entityType}</p>
            </button>
          )}
          empty={<EmptyState icon={ScrollText} title={hasFilters ? "No entries match your filters" : "No activity recorded yet"} />}
        />
        <Pagination pagination={entries.data?.pagination} onPageChange={(next) => setFilters({ page: next })} noun="entries" />
      </section>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{selected && actionLabel(selected.action)}</SheetTitle>
            <SheetDescription>{selected && format(new Date(selected.createdAt), "EEEE d MMMM yyyy, HH:mm:ss")}</SheetDescription>
          </SheetHeader>
          {selected && (
            <dl className="space-y-4 overflow-y-auto px-4 pb-6 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Who</dt>
                <dd className="font-medium">
                  {selected.actorName || "Unknown visitor"} {selected.actorRole && <span className="text-muted-foreground">· {ROLE_LABELS[selected.actorRole]}</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Target</dt>
                <dd>
                  {selected.entityLabel || "—"} <span className="text-muted-foreground capitalize">({selected.entityType})</span>
                </dd>
              </div>
              {selected.changes && (
                <div>
                  <dt className="mb-1.5 text-xs text-muted-foreground">Details</dt>
                  <dd>
                    <table className="w-full overflow-hidden rounded-md border text-xs">
                      <tbody className="divide-y">
                        {Object.entries(selected.changes).map(([key, value]) => (
                          <tr key={key}>
                            <th scope="row" className="w-1/3 bg-muted/50 px-2.5 py-1.5 text-left font-medium">{key}</th>
                            <td className="px-2.5 py-1.5 break-all">{formatValue(value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-muted-foreground">IP address</dt>
                <dd className="font-mono text-xs">{selected.ip || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Browser</dt>
                <dd className="text-xs break-words text-muted-foreground">{selected.userAgent || "—"}</dd>
              </div>
            </dl>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { History, MapPin, Radio, RefreshCw, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { FilterSelect } from "@/components/shared/filter-select";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { trackingApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { ROLE_LABELS } from "@/lib/permissions";
import { useRealtime } from "@/lib/realtime";
import { cn } from "@/lib/utils";
import { PRESENCE_STATUSES, STATUS_COLORS, STATUS_LABELS, type PresenceView } from "@/types/tracking";
import { StatusBadge } from "./status-badge";
import { StatusDialog } from "./status-dialog";

// three.js is large and browser-only: load the map on demand.
const HospitalMap3D = dynamic(() => import("./hospital-map-3d"), {
  ssr: false,
  loading: () => <Skeleton className="size-full rounded-none" />,
});

const floorLabel = (floor: number) => (floor === 0 ? "Ground floor" : floor < 0 ? `Basement ${-floor}` : `Floor ${floor}`);
const timeAgo = (iso: string | null) => {
  if (!iso) return "never";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  return mins < 1 ? "just now" : mins < 60 ? `${mins} min ago` : `${Math.round(mins / 60)} h ago`;
};

export function TrackingView() {
  const session = useSession();
  const isAdmin = session.can("tracking:all");
  const { status: liveStatus } = useRealtime();
  const presence = useQuery({ queryKey: queryKeys.presence, queryFn: trackingApi.presence });
  const locations = useQuery({ queryKey: queryKeys.locations, queryFn: trackingApi.locations, staleTime: 5 * 60_000 });

  const [floor, setFloor] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [editing, setEditing] = useState<PresenceView | null>(null);
  const [historyFor, setHistoryFor] = useState<PresenceView | null>(null);

  const floors = useMemo(() => [...new Set((locations.data ?? []).filter((l) => l.active).map((l) => l.floor))].sort((a, b) => a - b), [locations.data]);
  const activeFloor = floor ?? floors[0] ?? 0;

  // Others see doctors only; the API already scopes this, but keep "me" out of the doctor map for non-admins.
  const visible = useMemo(
    () => (presence.data ?? []).filter((p) => isAdmin || p.role === "doctor"),
    [presence.data, isAdmin],
  );
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visible.filter(
      (p) =>
        (!q || p.name.toLowerCase().includes(q) || p.location?.name.toLowerCase().includes(q) || p.location?.code.toLowerCase().includes(q)) &&
        (!role || p.role === role) &&
        (!statusFilter || p.status === statusFilter),
    );
  }, [visible, search, role, statusFilter]);

  const floorRooms = useMemo(() => (locations.data ?? []).filter((l) => l.active && l.floor === activeFloor), [locations.data, activeFloor]);
  const floorPeople = useMemo(() => filtered.filter((p) => p.location?.floor === activeFloor), [filtered, activeFloor]);
  const counts = useMemo(
    () => Object.fromEntries(PRESENCE_STATUSES.map((s) => [s, visible.filter((p) => p.status === s).length])) as Record<string, number>,
    [visible],
  );

  const select = (person: PresenceView | null) => {
    setSelected(person?.userId ?? null);
    if (person?.location) setFloor(person.location.floor);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live tracking"
        description={isAdmin ? "Where every doctor and staff member is right now." : "Where our doctors are right now."}
        actions={
          <span
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-lg border bg-card px-3 text-sm",
              liveStatus === "live" ? "text-foreground" : "text-muted-foreground",
            )}
            aria-live="polite"
          >
            <Radio className={cn("size-4", liveStatus === "live" ? "text-success" : "text-muted-foreground")} aria-hidden />
            {liveStatus === "live" ? "Live" : liveStatus === "connecting" ? "Connecting…" : "Reconnecting…"}
          </span>
        }
      />

      <section aria-label="Status summary" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {PRESENCE_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter((v) => (v === s ? undefined : s))}
            aria-pressed={statusFilter === s}
            className={cn(
              "flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/50",
              statusFilter === s && "ring-2 ring-ring",
            )}
          >
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s] }} aria-hidden />
              {STATUS_LABELS[s]}
            </span>
            <span className="text-xl font-semibold tabular-nums">{presence.isLoading ? "–" : counts[s]}</span>
          </button>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <section className="overflow-hidden rounded-xl border bg-card" aria-label="3D floor map">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
            <div role="tablist" aria-label="Floors" className="flex flex-wrap gap-1">
              {floors.map((f) => (
                <button
                  key={f}
                  role="tab"
                  type="button"
                  aria-selected={f === activeFloor}
                  onClick={() => setFloor(f)}
                  className={cn(
                    "h-9 rounded-md px-3 text-sm font-medium transition-colors",
                    f === activeFloor ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {floorLabel(f)}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Drag to rotate · scroll to zoom · click a person</p>
          </header>
          <div className="relative h-[420px] bg-muted/40 sm:h-[520px]">
            {locations.error ? (
              <ErrorState message={locations.error.message} onRetry={() => locations.refetch()} />
            ) : locations.isLoading || presence.isLoading ? (
              <Skeleton className="size-full rounded-none" />
            ) : floorRooms.length === 0 ? (
              <EmptyState icon={MapPin} title="No rooms on this floor" description={isAdmin ? "Add rooms on the Locations page." : undefined} />
            ) : (
              <HospitalMap3D
                locations={floorRooms}
                people={floorPeople}
                selectedUserId={selected}
                onSelect={(id) => select(id ? filtered.find((p) => p.userId === id) ?? null : null)}
              />
            )}
            <ul className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-2" aria-label="Legend">
              {PRESENCE_STATUSES.map((s) => (
                <li key={s} className="flex items-center gap-1.5 rounded-md bg-card/90 px-2 py-1 text-[11px] shadow-sm">
                  <span className="size-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[s] }} aria-hidden />
                  {STATUS_LABELS[s]}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="flex max-h-[640px] flex-col overflow-hidden rounded-xl border bg-card" aria-label="People">
          <div className="space-y-3 border-b p-4">
            <Input type="search" aria-label="Search people or rooms" placeholder="Search people or rooms…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-10" />
            {isAdmin && (
              <FilterSelect
                id="tracking-role"
                label="Role"
                allLabel="Everyone"
                value={role}
                onChange={setRole}
                options={(["doctor", "staff", "management", "admin"] as const).map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
              />
            )}
          </div>
          {presence.error ? (
            <ErrorState message={presence.error.message} onRetry={() => presence.refetch()} />
          ) : presence.isLoading ? (
            <div className="space-y-3 p-4">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Users} title="Nobody matches" />
          ) : (
            <ul className="flex-1 divide-y overflow-y-auto">
              {filtered.map((p) => (
                <li key={p.userId} className={cn("flex items-center gap-3 px-4 py-3", selected === p.userId && "bg-accent")}>
                  <button type="button" onClick={() => select(p)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <UserAvatar name={p.name} photoUrl={p.photoUrl} className="size-10" />
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="block truncate text-sm font-medium">{p.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {p.specialization ?? ROLE_LABELS[p.role]} · {p.location ? `${p.location.name} (${floorLabel(p.location.floor)})` : "No location"}
                      </span>
                      <span className="flex items-center gap-2">
                        <StatusBadge status={p.status} />
                        <span className="text-[11px] text-muted-foreground">{timeAgo(p.updatedAt)}</span>
                      </span>
                    </span>
                  </button>
                  <div className="flex shrink-0 flex-col gap-1">
                    {p.canUpdate && (
                      <Button variant="ghost" size="icon" onClick={() => setEditing(p)} aria-label={`Update ${p.name}'s location`}>
                        <RefreshCw />
                      </Button>
                    )}
                    {isAdmin && (
                      <Button variant="ghost" size="icon" onClick={() => setHistoryFor(p)} aria-label={`${p.name}'s movement history`}>
                        <History />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <StatusDialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)} target={editing} isSelf={editing?.userId === session.user?.id} />
      <HistorySheet person={historyFor} onClose={() => setHistoryFor(null)} />
    </div>
  );
}

function HistorySheet({ person, onClose }: { person: PresenceView | null; onClose: () => void }) {
  const history = useQuery({
    queryKey: queryKeys.presenceHistory(person?.userId ?? ""),
    queryFn: () => trackingApi.history(person!.userId),
    enabled: !!person,
  });
  return (
    <Sheet open={!!person} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{person?.name}</SheetTitle>
          <SheetDescription>Movements in the last 7 days (kept for 30 days).</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {history.isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : !history.data?.length ? (
            <EmptyState icon={History} title="No movements recorded" />
          ) : (
            <ol className="relative space-y-4 border-l pl-5">
              {history.data.map((e) => (
                <li key={e._id} className="relative">
                  <span className="absolute top-1.5 -left-[26px] size-2.5 rounded-full ring-4 ring-card" style={{ backgroundColor: STATUS_COLORS[e.status] }} aria-hidden />
                  <p className="text-sm font-medium">{e.location ? `${e.location.name} (${e.location.code})` : "No location"}</p>
                  <p className="text-xs text-muted-foreground">
                    {STATUS_LABELS[e.status]}
                    {e.note ? ` · ${e.note}` : ""} · {new Date(e.createdAt).toLocaleString()}
                    {e.updatedBy ? ` · by ${e.updatedBy.name}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

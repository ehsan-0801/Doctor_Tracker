"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Building2, Loader2, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { AccessDenied } from "@/components/shared/access-denied";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormField } from "@/components/shared/form-field";
import { EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSession } from "@/hooks/use-session";
import { ApiError } from "@/lib/api/client";
import { trackingApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { LOCATION_TYPE_LABELS, LOCATION_TYPES, type HospitalLocation, type LocationType } from "@/types/tracking";

type Draft = Omit<HospitalLocation, "_id">;
const EMPTY: Draft = { name: "", code: "", type: "consultation", floor: 0, x: 0, y: 0, w: 8, h: 6, active: true };
const floorLabel = (floor: number) => (floor === 0 ? "Ground floor" : floor < 0 ? `Basement ${-floor}` : `Floor ${floor}`);

export function LocationsView() {
  const session = useSession();
  const allowed = session.can("locations:manage");
  const queryClient = useQueryClient();
  const locations = useQuery({ queryKey: queryKeys.locations, queryFn: trackingApi.locations, enabled: allowed });
  const [editing, setEditing] = useState<HospitalLocation | "new" | null>(null);
  const [deleting, setDeleting] = useState<HospitalLocation | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => trackingApi.deleteLocation(id),
    onSuccess: async () => {
      toast.success("Location deleted");
      setDeleting(null);
      await Promise.all([queryClient.invalidateQueries({ queryKey: queryKeys.locations }), queryClient.invalidateQueries({ queryKey: queryKeys.presence })]);
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not delete"),
  });

  const rows = useMemo(() => (locations.data ?? []).slice().sort((a, b) => a.floor - b.floor || a.name.localeCompare(b.name)), [locations.data]);
  if (!session.isLoading && !allowed) return <AccessDenied />;

  const columns: Column<HospitalLocation>[] = [
    { id: "name", header: "Room", cell: (l) => <span className="font-medium">{l.name}</span> },
    { id: "code", header: "Code", cell: (l) => <span className="font-mono text-xs">{l.code}</span> },
    { id: "type", header: "Type", cell: (l) => LOCATION_TYPE_LABELS[l.type] },
    { id: "floor", header: "Floor", cell: (l) => floorLabel(l.floor) },
    { id: "grid", header: "Map position", cell: (l) => <span className="text-xs text-muted-foreground tabular-nums">{`x${l.x} y${l.y} · ${l.w}×${l.h}`}</span>, className: "hidden lg:table-cell", headerClassName: "hidden lg:table-cell" },
    { id: "active", header: "Status", cell: (l) => (l.active ? <Badge variant="secondary">Active</Badge> : <Badge variant="outline">Hidden</Badge>) },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "w-24 text-right",
      cell: (l) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => setEditing(l)} aria-label={`Edit ${l.name}`}>
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleting(l)} aria-label={`Delete ${l.name}`}>
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locations"
        description="Floors and rooms used for live tracking and the 3D map."
        actions={
          <Button size="lg" className="h-10 px-4" onClick={() => setEditing("new")}>
            <Plus aria-hidden /> Add room
          </Button>
        }
      />
      <section className="overflow-hidden rounded-xl border bg-card">
        <DataTable
          caption="Rooms"
          columns={columns}
          rows={rows}
          getRowId={(l) => l._id}
          isLoading={locations.isLoading}
          error={locations.error}
          onRetry={() => locations.refetch()}
          renderMobileCard={(l) => (
            <div className="flex items-center gap-3">
              <MapPin className="size-5 text-link" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{l.name}</p>
                <p className="text-xs text-muted-foreground">
                  {l.code} · {LOCATION_TYPE_LABELS[l.type]} · {floorLabel(l.floor)}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setEditing(l)} aria-label={`Edit ${l.name}`}>
                <Pencil />
              </Button>
            </div>
          )}
          empty={<EmptyState icon={Building2} title="No rooms yet" description="Add rooms to show them on the live map." />}
        />
      </section>
      <LocationDialog location={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this room?"
        description={`${deleting?.name ?? ""} will be removed from the map. Anyone checked in there will show "No location".`}
        confirmLabel="Delete room"
        pendingLabel="Deleting…"
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting._id)}
      />
    </div>
  );
}

function LocationDialog({ location, onClose }: { location: HospitalLocation | "new" | null; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const editing = location && location !== "new" ? location : null;
  return (
    <Dialog open={!!location} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit room" : "Add room"}</DialogTitle>
          <DialogDescription>Map position uses a grid where one unit is about one metre.</DialogDescription>
        </DialogHeader>
        {location && <LocationForm key={editing?._id ?? "new"} editing={editing} onSaving={setSaving} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function LocationForm({ editing, onSaving, onDone }: { editing: HospitalLocation | null; onSaving: (v: boolean) => void; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft>(() => (editing ? { ...editing } : EMPTY));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const num = (key: keyof Draft, label: string, min: number, max: number) => (
    <FormField id={`loc-${key}`} label={label} error={errors[key]}>
      <Input id={`loc-${key}`} type="number" min={min} max={max} className="h-10" value={draft[key] as number} onChange={(e) => set(key, Number(e.target.value) as never)} />
    </FormField>
  );

  const save = async () => {
    setSaving(true);
    onSaving(true);
    setErrors({});
    try {
      const { name, code, type, floor, x, y, w, h, active } = draft;
      const body = { name, code, type, floor, x, y, w, h, active };
      if (editing) await trackingApi.updateLocation(editing._id, body);
      else await trackingApi.createLocation(body);
      toast.success(editing ? "Room updated" : "Room added");
      await queryClient.invalidateQueries({ queryKey: queryKeys.locations });
      onDone();
    } catch (error) {
      if (error instanceof ApiError && error.errors.length) setErrors(Object.fromEntries(error.errors.map((e) => [e.field ?? "", e.message])));
      else toast.error(error instanceof ApiError ? error.message : "Could not save");
    } finally {
      setSaving(false);
      onSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <FormField id="loc-name" label="Name" error={errors.name}>
            <Input id="loc-name" className="h-10" value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="Operation Theatre 3" />
          </FormField>
          <FormField id="loc-code" label="Code" error={errors.code}>
            <Input id="loc-code" className="h-10 uppercase" value={draft.code} onChange={(e) => set("code", e.target.value)} placeholder="OT-3" />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="loc-type" label="Type">
            <Select value={draft.type} onValueChange={(v) => set("type", v as LocationType)}>
              <SelectTrigger id="loc-type" className="h-10! w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {LOCATION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {LOCATION_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          {num("floor", "Floor (0 = ground)", -5, 50)}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {num("x", "X", 0, 200)}
          {num("y", "Y", 0, 200)}
          {num("w", "Width", 1, 100)}
          {num("h", "Depth", 1, 100)}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={draft.active} onChange={(e) => set("active", e.target.checked)} />
          Show on the map and in check-in lists
        </label>
      </div>
      <DialogFooter className="pt-2">
        <Button variant="outline" size="lg" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
        <Button size="lg" onClick={save} disabled={saving}>
          {saving && <Loader2 className="animate-spin" aria-hidden />}
          {editing ? "Save changes" : "Add room"}
        </Button>
      </DialogFooter>
    </>
  );
}

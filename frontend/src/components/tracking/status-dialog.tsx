"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import { trackingApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { PRESENCE_STATUSES, STATUS_LABELS, type PresenceStatus, type PresenceView } from "@/types/tracking";

const NO_ROOM = "__none__";

type Target = Pick<PresenceView, "userId" | "name" | "status" | "note" | "location">;

/** Check in / update status and room for yourself or someone you are allowed to update. */
export function StatusDialog({
  target,
  open,
  onOpenChange,
  isSelf,
}: {
  target: Target | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSelf?: boolean;
}) {
  const [saving, setSaving] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isSelf ? "Update my status" : `Update ${target?.name ?? ""}`}</DialogTitle>
          <DialogDescription>Location changes appear instantly on the live map.</DialogDescription>
        </DialogHeader>
        {open && target && (
          // Keyed so the form state starts from the current target each time it opens.
          <StatusForm key={target.userId} target={target} isSelf={isSelf} onSaving={setSaving} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatusForm({ target, isSelf, onSaving, onDone }: { target: Target; isSelf?: boolean; onSaving: (v: boolean) => void; onDone: () => void }) {
  const queryClient = useQueryClient();
  const locations = useQuery({ queryKey: queryKeys.locations, queryFn: trackingApi.locations, staleTime: 5 * 60_000 });
  const [status, setStatus] = useState<PresenceStatus>(target.status === "off_duty" ? "available" : target.status);
  const [locationId, setLocationId] = useState<string>(target.location?._id ?? NO_ROOM);
  const [note, setNote] = useState(target.note ?? "");
  const [saving, setSaving] = useState(false);

  const floors = [...new Set((locations.data ?? []).filter((l) => l.active).map((l) => l.floor))].sort((a, b) => a - b);
  const offDuty = status === "off_duty";

  const save = async () => {
    setSaving(true);
    onSaving(true);
    try {
      const updated = await trackingApi.setPresence(target.userId, { status, locationId: offDuty || locationId === NO_ROOM ? null : locationId, note });
      queryClient.setQueryData<PresenceView[]>(queryKeys.presence, (list) =>
        list ? (list.some((p) => p.userId === updated.userId) ? list.map((p) => (p.userId === updated.userId ? updated : p)) : [...list, updated]) : list,
      );
      toast.success(isSelf ? "Your status is updated" : `${target.name}'s location is updated`);
      onDone();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update the location");
    } finally {
      setSaving(false);
      onSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <FormField id="presence-status" label="Status">
          <Select value={status} onValueChange={(v) => setStatus(v as PresenceStatus)}>
            <SelectTrigger id="presence-status" className="h-10! w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {PRESENCE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField id="presence-location" label="Location" hint={offDuty ? "Off duty clears the location." : undefined}>
          <Select value={offDuty ? NO_ROOM : locationId} onValueChange={setLocationId} disabled={offDuty}>
            <SelectTrigger id="presence-location" className="h-10! w-full">
              <SelectValue placeholder="Choose a room" />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-72">
              <SelectItem value={NO_ROOM}>No specific room</SelectItem>
              {floors.map((floor) => (
                <SelectGroup key={floor}>
                  <SelectLabel>{floor === 0 ? "Ground floor" : `Floor ${floor}`}</SelectLabel>
                  {(locations.data ?? [])
                    .filter((l) => l.active && l.floor === floor)
                    .map((l) => (
                      <SelectItem key={l._id} value={l._id}>
                        {l.name} ({l.code})
                      </SelectItem>
                    ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField id="presence-note" label="Note (optional)">
          <Input id="presence-note" className="h-10" maxLength={120} placeholder="e.g. Ward rounds, back at 14:00" value={note} onChange={(e) => setNote(e.target.value)} />
        </FormField>
      </div>
      <DialogFooter className="pt-2">
        <Button variant="outline" size="lg" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
        <Button size="lg" onClick={save} disabled={saving}>
          {saving && <Loader2 className="animate-spin" aria-hidden />}
          Save
        </Button>
      </DialogFooter>
    </>
  );
}

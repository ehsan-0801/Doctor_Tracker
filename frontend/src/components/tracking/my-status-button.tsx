"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { trackingApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { STATUS_COLORS, STATUS_LABELS } from "@/types/tracking";
import { StatusDialog } from "./status-dialog";

/** Header control: shows your live status and opens the check-in dialog. */
export function MyStatusButton() {
  const { user } = useSession();
  const presence = useQuery({ queryKey: queryKeys.presence, queryFn: trackingApi.presence, enabled: !!user, staleTime: 60_000 });
  const [open, setOpen] = useState(false);
  const me = presence.data?.find((p) => p.userId === user?.id);
  if (!user) return null;
  const status = me?.status ?? "off_duty";

  return (
    <>
      <Button variant="outline" size="lg" className="h-9 gap-2 px-3" onClick={() => setOpen(true)} aria-label={`My status: ${STATUS_LABELS[status]}. Change`}>
        <span className="size-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} aria-hidden />
        <span className="hidden text-sm md:inline">{STATUS_LABELS[status]}</span>
        {me?.location && <span className="hidden text-xs text-muted-foreground xl:inline">· {me.location.code}</span>}
      </Button>
      <StatusDialog
        open={open}
        onOpenChange={setOpen}
        isSelf
        target={{ userId: user.id, name: user.name, status, note: me?.note ?? "", location: me?.location ?? null }}
      />
    </>
  );
}

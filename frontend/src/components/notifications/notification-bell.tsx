"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, CheckCheck, MapPin, MessageSquare, UserPlus, UserMinus, Users, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { notificationsApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types/audit";

const ICONS: Record<AppNotification["type"], typeof Bell> = {
  message: MessageSquare,
  patient_assigned: UserPlus,
  patient_unassigned: UserMinus,
  location_updated: MapPin,
  staff_assigned: Users,
  system: Info,
};

type Data = { items: AppNotification[]; unread: number; hasMore: boolean };

/** Header bell: unread badge, latest notifications, mark read. Updated live by RealtimeProvider. */
export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const notifications = useQuery({ queryKey: queryKeys.notifications, queryFn: notificationsApi.list, staleTime: 60_000 });
  const unread = notifications.data?.unread ?? 0;

  const setData = (fn: (d: Data) => Data) => queryClient.setQueryData<Data>(queryKeys.notifications, (d) => (d ? fn(d) : d));

  const openItem = async (n: AppNotification) => {
    setOpen(false);
    if (!n.read) {
      setData((d) => ({ ...d, unread: Math.max(0, d.unread - 1), items: d.items.map((x) => (x._id === n._id ? { ...x, read: true } : x)) }));
      void notificationsApi.read(n._id);
    }
    if (n.link) router.push(n.link);
  };

  const readAll = async () => {
    setData((d) => ({ ...d, unread: 0, items: d.items.map((x) => ({ ...x, read: true })) }));
    await notificationsApi.readAll();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="relative" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
          <Bell className="size-[18px]" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand-word)] px-1 text-[10px] font-semibold text-white" aria-hidden>
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,380px)] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          <Button variant="ghost" size="sm" onClick={readAll} disabled={!unread}>
            <CheckCheck aria-hidden /> Mark all read
          </Button>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {notifications.isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : !notifications.data?.items.length ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
          ) : (
            <ul className="divide-y">
              {notifications.data.items.map((n) => {
                const Icon = ICONS[n.type] ?? Info;
                return (
                  <li key={n._id}>
                    <button type="button" onClick={() => openItem(n)} className={cn("flex w-full gap-3 px-4 py-3 text-left hover:bg-muted/60", !n.read && "bg-accent/60")}>
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-link">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className={cn("text-sm", !n.read ? "font-semibold" : "font-medium")}>{n.title}</span>
                          {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[var(--brand-word)]" aria-label="Unread" />}
                        </span>
                        {n.body && <span className="line-clamp-2 block text-xs text-muted-foreground">{n.body}</span>}
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">{formatDistanceToNowStrict(new Date(n.createdAt), { addSuffix: true })}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { trackingApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import type { ChatMessage, ConversationSummary, PresenceView } from "@/types/tracking";

/**
 * WebSocket endpoint of the Express API. The browser connects directly (the
 * frontend's /api rewrite cannot proxy WebSockets on Vercel).
 */
function realtimeUrl(): string {
  if (process.env.NEXT_PUBLIC_REALTIME_URL) return process.env.NEXT_PUBLIC_REALTIME_URL.replace(/\/+$/, "");
  return `${window.location.protocol}//${window.location.hostname}:4000`;
}

type Status = "connecting" | "live" | "offline";
const RealtimeContext = createContext<{ socket: Socket | null; status: Status }>({ socket: null, status: "offline" });

/**
 * Opens one authenticated socket for the signed-in portal and folds incoming
 * events into the React Query cache, so every view updates without refetching.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<Status>("connecting");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const s = io(realtimeUrl(), {
      transports: ["websocket"],
      // Fresh short-lived token for every (re)connection attempt.
      auth: (cb) => {
        trackingApi
          .realtimeToken()
          .then(({ token }) => cb({ token }))
          .catch(() => cb({ token: "" }));
      },
    });
    s.on("connect", () => setStatus("live"));
    s.on("disconnect", () => setStatus("offline"));
    s.on("connect_error", () => setStatus("offline"));

    s.on("presence:update", (update: PresenceView) => {
      queryClient.setQueryData<PresenceView[]>(queryKeys.presence, (list) => {
        if (!list) return list;
        const i = list.findIndex((p) => p.userId === update.userId);
        if (i === -1) return [...list, { ...update, canUpdate: false }];
        const next = [...list];
        next[i] = { ...update, canUpdate: list[i]!.canUpdate };
        return next;
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.presenceHistory(update.userId) });
    });

    s.on("chat:message", ({ conversationId, message }: { conversationId: string; message: ChatMessage }) => {
      queryClient.setQueryData<{ messages: ChatMessage[] } & Record<string, unknown>>(queryKeys.chat.messages(conversationId), (thread) =>
        thread && !thread.messages.some((m) => m._id === message._id) ? { ...thread, messages: [...thread.messages, message] } : thread,
      );
      // Update the preview instantly and move the conversation to the top; the
      // refetch then reconciles unread counts.
      queryClient.setQueryData<ConversationSummary[]>(queryKeys.chat.conversations, (list) => {
        const i = list?.findIndex((c) => c._id === conversationId) ?? -1;
        if (!list || i === -1) return list;
        const updated = { ...list[i]!, lastMessage: message.body.slice(0, 140), lastMessageAt: message.createdAt, lastSenderId: message.senderId };
        return [updated, ...list.slice(0, i), ...list.slice(i + 1)];
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations });
    });
    s.on("chat:read", () => void queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations }));
    s.on("user:online", ({ userId, online }: { userId: string; online: boolean }) => {
      queryClient.setQueryData<ConversationSummary[]>(queryKeys.chat.conversations, (list) =>
        list?.map((c) => (c.contact._id === userId ? { ...c, contact: { ...c.contact, online } } : c)),
      );
      queryClient.setQueryData<{ _id: string; online: boolean }[]>(queryKeys.chat.contacts, (list) =>
        list?.map((c) => (c._id === userId ? { ...c, online } : c)),
      );
    });

    setSocket(s);
    return () => {
      s.disconnect();
      started.current = false;
    };
  }, [queryClient]);

  return <RealtimeContext.Provider value={{ socket, status }}>{children}</RealtimeContext.Provider>;
}

export const useRealtime = () => useContext(RealtimeContext);

"use client";

import { useQuery } from "@tanstack/react-query";
import { chatApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";

/** Total unread chat messages (kept fresh by real-time events). */
export function useUnreadCount(): number {
  const conversations = useQuery({ queryKey: queryKeys.chat.conversations, queryFn: chatApi.conversations, staleTime: 60_000 });
  return (conversations.data ?? []).reduce((sum, c) => sum + c.unread, 0);
}

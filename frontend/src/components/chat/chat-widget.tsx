"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Maximize2, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { useUnreadCount } from "@/hooks/use-unread-count";
import { ApiError } from "@/lib/api/client";
import { chatApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { chatWidget, useChatWidget } from "@/lib/chat-widget";
import { cn } from "@/lib/utils";
import type { ChatContact } from "@/types/tracking";
import { ConversationList, CountBadge, NewChatButton, Thread } from "./messages-view";

/**
 * Floating chat available on every portal page (except the full Messages page):
 * a launcher with the unread count and a panel holding the conversation list or one thread.
 */
export function ChatWidget() {
  const pathname = usePathname();
  const { user } = useSession();
  const { open, conversationId } = useChatWidget();
  const unread = useUnreadCount();
  const queryClient = useQueryClient();
  const conversations = useQuery({ queryKey: queryKeys.chat.conversations, queryFn: chatApi.conversations, enabled: !!user });
  const panelRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const hidden = !user || pathname.startsWith("/messages");

  // Move focus into the panel when it opens; Escape closes it and returns focus to the launcher.
  useEffect(() => {
    if (!open || hidden) return;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      chatWidget.close();
      launcherRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, hidden]);

  if (hidden) return null;

  const startWith = async (contact: ChatContact) => {
    try {
      const conversation = await chatApi.open(contact._id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations });
      chatWidget.open(conversation._id);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not start the conversation");
    }
  };

  const fullPage = conversationId ? `/messages?c=${conversationId}` : "/messages";
  const panelActions = (
    <>
      <Button asChild variant="ghost" size="icon" aria-label="Open in Messages">
        <Link href={fullPage} onClick={() => chatWidget.close()}>
          <Maximize2 />
        </Link>
      </Button>
      <Button variant="ghost" size="icon" onClick={() => chatWidget.close()} aria-label="Close chat">
        <X />
      </Button>
    </>
  );

  return (
    <>
      {open && (
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-label="Chat"
          className={cn(
            "fixed inset-0 z-50 flex flex-col overflow-hidden bg-card text-card-foreground outline-none",
            "sm:inset-auto sm:right-4 sm:bottom-22 sm:h-[min(600px,calc(100dvh-8rem))] sm:w-[380px] sm:rounded-xl sm:border sm:shadow-2xl",
            "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2",
          )}
        >
          {conversationId ? (
            <Thread
              key={conversationId}
              conversationId={conversationId}
              myId={user.id}
              compact
              onBack={() => chatWidget.showList()}
              summary={conversations.data?.find((c) => c._id === conversationId)}
              actions={panelActions}
              backCount={(conversations.data ?? []).reduce((sum, c) => (c._id === conversationId ? sum : sum + c.unread), 0)}
            />
          ) : (
            <>
              <header className="flex items-center gap-1 border-b py-2 pr-2 pl-4">
                <h2 className="flex flex-1 items-center gap-2 font-semibold">
                  Messages
                  {unread > 0 && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground tabular-nums" aria-live="polite">
                      {unread > 99 ? "99+" : unread} new
                    </span>
                  )}
                </h2>
                <NewChatButton onPick={startWith} compact />
                {panelActions}
              </header>
              <nav aria-label="Conversations" className="flex min-h-0 flex-1 flex-col">
                <ConversationList activeId={null} onOpen={(id) => chatWidget.open(id)} />
              </nav>
            </>
          )}
        </div>
      )}

      <button
        ref={launcherRef}
        type="button"
        onClick={() => chatWidget.toggle()}
        aria-expanded={open}
        aria-label={`${open ? "Close chat" : "Open chat"}${unread ? `, ${unread} unread` : ""}`}
        className={cn(
          "fixed right-4 bottom-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none",
          open && "max-sm:hidden",
        )}
      >
        {open ? <X className="size-6" aria-hidden /> : <MessageCircle className="size-6" aria-hidden />}
        {unread > 0 && <CountBadge count={unread} className="absolute -top-1 -right-1 ring-background" />}
      </button>
    </>
  );
}

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
import { ConversationList, NewChatButton, Thread } from "./messages-view";

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
            />
          ) : (
            <>
              <header className="flex items-center gap-1 border-b py-2 pr-2 pl-4">
                <h2 className="flex-1 font-semibold">Messages</h2>
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
        aria-label={open ? "Close chat" : unread ? `Open chat, ${unread} unread` : "Open chat"}
        className={cn(
          "fixed right-4 bottom-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none",
          open && "max-sm:hidden",
        )}
      >
        {open ? <X className="size-6" aria-hidden /> : <MessageCircle className="size-6" aria-hidden />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-deep px-1.5 text-[11px] font-semibold text-white ring-2 ring-background">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
    </>
  );
}

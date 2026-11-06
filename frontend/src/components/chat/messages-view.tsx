"use client";

import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isSameDay, isToday, isYesterday } from "date-fns";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, MessageSquarePlus, MessagesSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-session";
import { ApiError } from "@/lib/api/client";
import { chatApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { ROLE_LABELS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { ChatContact, ChatMessage, ConversationSummary } from "@/types/tracking";

const dayLabel = (d: Date) => (isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "EEEE, d MMM"));
const shortTime = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return isToday(d) ? format(d, "HH:mm") : format(d, "d MMM");
};

function OnlineDot({ online }: { online: boolean }) {
  return (
    <span
      className={cn("absolute right-0 bottom-0 size-3 rounded-full ring-2 ring-card", online ? "bg-success" : "bg-muted-foreground/40")}
      aria-label={online ? "Online" : "Offline"}
    />
  );
}

export function MessagesView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeId = searchParams.get("c");
  const { user } = useSession();
  const queryClient = useQueryClient();

  const conversations = useQuery({ queryKey: queryKeys.chat.conversations, queryFn: chatApi.conversations });
  const open = (id: string | null) => router.replace(id ? `${pathname}?c=${id}` : pathname, { scroll: false });

  const startWith = async (contact: ChatContact) => {
    try {
      const conversation = await chatApi.open(contact._id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations });
      open(conversation._id);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not start the conversation");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Messages" description="Real-time messages with your care team." actions={<NewChatButton onPick={startWith} />} />
      <div className="grid h-[calc(100dvh-14rem)] min-h-[480px] overflow-hidden rounded-xl border bg-card md:grid-cols-[320px_1fr]">
        <aside className={cn("flex min-h-0 flex-col border-r", activeId && "hidden md:flex")} aria-label="Conversations">
          {conversations.error ? (
            <ErrorState message={conversations.error.message} onRetry={() => conversations.refetch()} />
          ) : conversations.isLoading ? (
            <div className="space-y-3 p-4">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : !conversations.data?.length ? (
            <EmptyState icon={MessagesSquare} title="No conversations yet" description="Start one with “New message”." />
          ) : (
            <ul className="flex-1 overflow-y-auto">
              {conversations.data.map((c) => (
                <li key={c._id}>
                  <button
                    type="button"
                    onClick={() => open(c._id)}
                    aria-current={c._id === activeId ? "true" : undefined}
                    className={cn("flex w-full items-center gap-3 border-b px-4 py-3 text-left hover:bg-muted/60", c._id === activeId && "bg-accent")}
                  >
                    <span className="relative">
                      <UserAvatar name={c.contact.name} photoUrl={c.contact.photoUrl} className="size-11" />
                      <OnlineDot online={c.contact.online} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={cn("truncate text-sm", c.unread ? "font-semibold" : "font-medium")}>{c.contact.name}</span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{shortTime(c.lastMessageAt)}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className={cn("truncate text-xs", c.unread ? "text-foreground" : "text-muted-foreground")}>
                          {c.lastSenderId === user?.id ? "You: " : ""}
                          {c.lastMessage}
                        </span>
                        {c.unread > 0 && (
                          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                            {c.unread}
                            <span className="sr-only"> unread</span>
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
        <section className={cn("min-h-0 flex-col", activeId ? "flex" : "hidden md:flex")} aria-label="Conversation">
          {activeId && user ? (
            <Thread key={activeId} conversationId={activeId} myId={user.id} onBack={() => open(null)} summary={conversations.data?.find((c) => c._id === activeId)} />
          ) : (
            <EmptyState icon={MessagesSquare} title="Select a conversation" description="Messages appear here instantly." className="m-auto" />
          )}
        </section>
      </div>
    </div>
  );
}

function NewChatButton({ onPick }: { onPick: (contact: ChatContact) => void }) {
  const [open, setOpen] = useState(false);
  const contacts = useQuery({ queryKey: queryKeys.chat.contacts, queryFn: chatApi.contacts, enabled: open });
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="lg" className="h-10 px-4">
          <MessageSquarePlus aria-hidden /> New message
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <Command>
          <CommandInput placeholder="Search people…" />
          <CommandList>
            <CommandEmpty>{contacts.isLoading ? "Loading…" : "Nobody you can message."}</CommandEmpty>
            <CommandGroup heading="You can message">
              {contacts.data?.map((c) => (
                <CommandItem
                  key={c._id}
                  value={`${c.name} ${c.role}`}
                  onSelect={() => {
                    setOpen(false);
                    onPick(c);
                  }}
                >
                  <span className="relative">
                    <UserAvatar name={c.name} photoUrl={c.photoUrl} className="size-7" />
                    <OnlineDot online={c.online} />
                  </span>
                  <span className="truncate">{c.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{ROLE_LABELS[c.role]}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

type ThreadPage = Awaited<ReturnType<typeof chatApi.messages>>;

function Thread({ conversationId, myId, onBack, summary }: { conversationId: string; myId: string; onBack: () => void; summary?: ConversationSummary }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Latest page lives under the shared key so real-time messages append to it.
  const latest = useQuery({ queryKey: queryKeys.chat.messages(conversationId), queryFn: () => chatApi.messages(conversationId) });
  const older = useInfiniteQuery({
    queryKey: [...queryKeys.chat.messages(conversationId), "older"],
    queryFn: ({ pageParam }) => chatApi.messages(conversationId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: ThreadPage) => (last.hasMore ? last.messages[0]?.createdAt : undefined),
    enabled: false,
  });

  const messages = useMemo<ChatMessage[]>(() => {
    const olderPages = (older.data?.pages ?? []).slice().reverse().flatMap((p) => p.messages);
    const seen = new Set<string>();
    return [...olderPages, ...(latest.data?.messages ?? [])].filter((m) => !seen.has(m._id) && (seen.add(m._id), true));
  }, [older.data, latest.data]);

  const contact = latest.data?.contact ?? summary?.contact;
  const canSend = latest.data?.canSend ?? summary?.canSend ?? false;
  const lastId = messages.at(-1)?._id;

  // Mark read when opened and whenever a new message arrives while open.
  useEffect(() => {
    if (!lastId) return;
    void chatApi.read(conversationId).then(() => queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations }));
  }, [conversationId, lastId, queryClient]);

  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [lastId]);

  const loadOlder = async () => {
    const before = messages[0]?.createdAt;
    if (!before) return;
    if (!older.data) {
      await queryClient.fetchInfiniteQuery({
        queryKey: [...queryKeys.chat.messages(conversationId), "older"],
        queryFn: () => chatApi.messages(conversationId, before),
        initialPageParam: before,
      });
    } else await older.fetchNextPage();
  };
  const hasOlder = older.data ? older.hasNextPage : latest.data?.hasMore;

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const message = await chatApi.send(conversationId, body);
      setText("");
      queryClient.setQueryData<ThreadPage>(queryKeys.chat.messages(conversationId), (t) =>
        t && !t.messages.some((m) => m._id === message._id) ? { ...t, messages: [...t.messages, message] } : t,
      );
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Message not sent");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack} aria-label="Back to conversations">
          <ArrowLeft />
        </Button>
        {contact ? (
          <>
            <span className="relative">
              <UserAvatar name={contact.name} photoUrl={contact.photoUrl} className="size-10" />
              <OnlineDot online={contact.online} />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{contact.name}</p>
              <p className="text-xs text-muted-foreground">
                {ROLE_LABELS[contact.role]} · {contact.online ? "Online" : "Offline"}
              </p>
            </div>
          </>
        ) : (
          <Skeleton className="h-10 w-48" />
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4" aria-live="polite" aria-relevant="additions">
        {latest.isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className={cn("h-10 w-2/3", i % 2 && "ml-auto")} />)}</div>
        ) : latest.error ? (
          <ErrorState message={latest.error.message} onRetry={() => latest.refetch()} />
        ) : (
          <ol className="space-y-1.5">
            {hasOlder && (
              <li className="pb-2 text-center">
                <Button variant="outline" size="sm" onClick={loadOlder} disabled={older.isFetching}>
                  {older.isFetching ? <Loader2 className="animate-spin" aria-hidden /> : null} Load earlier messages
                </Button>
              </li>
            )}
            {messages.length === 0 && <li className="py-10 text-center text-sm text-muted-foreground">Say hello to start the conversation.</li>}
            {messages.map((m, i) => {
              const mine = m.senderId === myId;
              const date = new Date(m.createdAt);
              const newDay = i === 0 || !isSameDay(date, new Date(messages[i - 1]!.createdAt));
              return (
                <li key={m._id}>
                  {newDay && <p className="my-3 text-center text-[11px] font-medium text-muted-foreground">{dayLabel(date)}</p>}
                  <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap",
                        mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm border bg-muted text-foreground",
                      )}
                    >
                      {m.body}
                      <span className={cn("mt-0.5 block text-right text-[10px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {format(date, "HH:mm")}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="flex items-end gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <Textarea
          aria-label="Message"
          rows={1}
          maxLength={2000}
          disabled={!canSend}
          placeholder={canSend ? "Write a message…  (Enter to send, Shift+Enter for a new line)" : "You can no longer message this person"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void send();
            }
          }}
          className="max-h-36 min-h-10 resize-none"
        />
        <Button type="submit" size="icon-lg" className="size-10 shrink-0" disabled={!canSend || sending || !text.trim()} aria-label="Send message">
          {sending ? <Loader2 className="animate-spin" /> : <Send />}
        </Button>
      </form>
    </>
  );
}

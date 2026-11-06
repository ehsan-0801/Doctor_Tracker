import type { Metadata } from "next";
import { Suspense } from "react";
import { MessagesView } from "@/components/chat/messages-view";

export const metadata: Metadata = { title: "Messages" };

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesView />
    </Suspense>
  );
}

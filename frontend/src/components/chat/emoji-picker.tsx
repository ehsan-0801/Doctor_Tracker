"use client";

import { useState } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** A compact set covering everyday work chat; the OS emoji keyboard still works for anything else. */
const GROUPS: { label: string; emojis: string[] }[] = [
  { label: "Smileys", emojis: ["😀", "😁", "😂", "🙂", "😊", "😉", "😍", "🤔", "😅", "😮", "😢", "😴", "😷", "🤒", "🥳", "😎"] },
  { label: "Gestures", emojis: ["👍", "👎", "👌", "👏", "🙏", "💪", "👋", "✌️", "🤝", "🙌", "☝️", "✋"] },
  { label: "Care & work", emojis: ["❤️", "🩺", "💊", "💉", "🩹", "🏥", "🚑", "🧪", "🩻", "📋", "📅", "⏰", "☕", "✅", "❌", "⚠️", "🔥", "⭐", "🎉", "📎"] },
];

export function EmojiPicker({ onPick, disabled }: { onPick: (emoji: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon-lg" className="size-10 shrink-0" disabled={disabled} aria-label="Insert emoji">
          <Smile />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" className="w-72 p-2">
        {GROUPS.map((group) => (
          <div key={group.label} role="group" aria-label={group.label} className="mb-1 last:mb-0">
            <p className="px-1 pb-1 text-[11px] font-medium text-muted-foreground">{group.label}</p>
            <div className="grid grid-cols-8 gap-0.5">
              {group.emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onPick(emoji);
                    setOpen(false);
                  }}
                  className="flex size-8 items-center justify-center rounded-md text-lg hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  aria-label={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

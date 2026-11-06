"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

/** Debounced search box: local state while typing, `onSearch` after a pause. */
export function SearchInput({
  value,
  onSearch,
  placeholder,
  label,
}: {
  value: string | undefined;
  onSearch: (value: string | undefined) => void;
  placeholder: string;
  label: string;
}) {
  const [text, setText] = useState(value ?? "");
  const [syncedValue, setSyncedValue] = useState(value);
  const debounced = useDebouncedValue(text.trim(), 350);

  // Follow external changes (e.g. "Clear filters") by adjusting state during render.
  if (value !== syncedValue) {
    setSyncedValue(value);
    if ((value ?? "") !== text.trim()) setText(value ?? "");
  }

  useEffect(() => {
    if (debounced !== (value ?? "")) onSearch(debounced || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the debounced text
  }, [debounced]);

  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="h-10 bg-card pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          onClick={() => setText("")}
          className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { FilterX, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Search row plus filter controls. On mobile the filters collapse behind a
 * toggle that shows how many are active.
 */
export function FilterBar({
  search,
  children,
  activeCount,
  onClear,
  canClear,
}: {
  search: React.ReactNode;
  children: React.ReactNode;
  activeCount: number;
  onClear: () => void;
  canClear: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3 border-b p-4">
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">{search}</div>
        <Button
          variant="outline"
          className="h-10 bg-card px-3 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="list-filters"
        >
          <SlidersHorizontal aria-hidden />
          Filters
          {activeCount > 0 && (
            <span className="ml-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </div>
      <div
        id="list-filters"
        className={cn("grid-cols-1 items-end gap-3 sm:grid-cols-2 md:grid md:grid-cols-[repeat(3,minmax(0,1fr))_auto]", open ? "grid" : "hidden")}
      >
        {children}
        <Button variant="ghost" className="h-10 text-muted-foreground" onClick={onClear} disabled={!canClear}>
          <FilterX aria-hidden />
          Clear filters
        </Button>
      </div>
    </div>
  );
}

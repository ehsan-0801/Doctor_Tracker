"use client";

import type { SortState } from "./data-table";
import { FilterSelect } from "./filter-select";

const OPTIONS = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "name:asc", label: "Name A–Z" },
  { value: "name:desc", label: "Name Z–A" },
];

/** Mobile sort control; tables use sortable column headers on wider screens. */
export function SortSelect({ id, sort, onChange }: { id: string; sort: SortState; onChange: (sort: SortState) => void }) {
  const current = `${sort.sortBy}:${sort.sortOrder}`;
  return (
    <div className="md:hidden">
      <FilterSelect
        id={id}
        label="Sort by"
        allLabel="Newest first"
        value={current === OPTIONS[0]!.value ? undefined : current}
        options={OPTIONS.slice(1)}
        onChange={(value) => {
          const [sortBy, sortOrder] = (value ?? OPTIONS[0]!.value).split(":") as [string, "asc" | "desc"];
          onChange({ sortBy, sortOrder });
        }}
      />
    </div>
  );
}

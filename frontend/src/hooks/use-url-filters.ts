"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

/**
 * Keeps list state (filters, sort, page) in the URL so it survives refresh and
 * back/forward and can be shared. Changing anything other than `page` resets to page 1.
 */
export function useUrlFilters<K extends string>(keys: readonly K[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const values = useMemo(() => {
    const result = {} as Record<K, string | undefined>;
    for (const key of keys) result[key] = searchParams.get(key) ?? undefined;
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keys is a constant tuple
  }, [searchParams]);

  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const setFilters = useCallback(
    (updates: Partial<Record<K | "page", string | number | undefined>>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "" || (key === "page" && value === 1)) next.delete(key);
        else next.set(key, String(value));
      }
      if (!("page" in updates)) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { values, page, setFilters };
}

/** Validated sort from URL values; defaults to newest first. */
export function readSort(sortBy: string | undefined, sortOrder: string | undefined) {
  return {
    sortBy: sortBy === "name" ? ("name" as const) : ("createdAt" as const),
    sortOrder: sortOrder === "asc" ? ("asc" as const) : ("desc" as const),
  };
}

/** Count and clear helpers for the subset of URL keys that are filters. */
export function filterState<K extends string>(
  values: Record<K, string | undefined>,
  filterKeys: readonly K[],
  setFilters: (updates: Partial<Record<K, undefined>>) => void,
  /** Dependent keys removed together with the filters (one URL update). */
  alsoClear: readonly K[] = [],
) {
  const active = filterKeys.filter((key) => values[key]);
  return {
    hasFilters: active.length > 0,
    // The search box is always visible, so the mobile "Filters" badge counts the rest.
    panelCount: active.filter((key) => key !== "search").length,
    clear: () =>
      setFilters(Object.fromEntries([...filterKeys, ...alsoClear].map((key) => [key, undefined])) as Partial<Record<K, undefined>>),
  };
}

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

/**
 * Keeps list filters in the URL so they survive refresh, back/forward and can be
 * shared. Changing any filter other than `page` resets to page 1.
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

  const clearFilters = useCallback(() => router.replace(pathname, { scroll: false }), [pathname, router]);

  const activeCount = keys.filter((key) => key !== "search" && values[key]).length;

  return { values, page, setFilters, clearFilters, activeCount };
}

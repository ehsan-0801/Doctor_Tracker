"use client";

import { useEffect, useState } from "react";
import { publicApi } from "@/lib/api/endpoints";
import { formatNumberFor } from "@/lib/i18n/dictionaries";
import { useLanguage } from "./language-provider";
import type { PublicSite } from "@/types/site";

const REFRESH_MS = 30_000;

/**
 * Network figures straight from the database: server-rendered first, then
 * refreshed every 30 seconds in the browser (paused while the tab is hidden).
 * Polling starts after mount so the prerendered HTML stays deterministic.
 */
export function LiveStats({ initial }: { initial: PublicSite }) {
  const { t, lang } = useLanguage();
  const [stats, setStats] = useState(initial.stats);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      if (document.hidden) return;
      try {
        const site = await publicApi.site();
        if (!cancelled) {
          setStats(site.stats);
          setUpdatedAt(new Date());
        }
      } catch {
        // Keep showing the last known figures.
      }
    };
    void refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  if (!stats) return null;

  const items = [
    { label: t.stats.doctors, value: stats.doctors },
    { label: t.stats.specialities, value: stats.specializations },
    { label: t.stats.hospitals, value: stats.hospitals },
  ];

  return (
    <section aria-labelledby="live-stats-title" className="max-w-lg">
      <h2 id="live-stats-title" className="sr-only">{t.stats.title}</h2>
      <dl className="grid grid-cols-3 divide-x divide-border border-y border-border py-5">
        {items.map((item) => (
          <div key={item.label} className="px-4 first:pl-0">
            <dd className="text-3xl font-semibold tracking-tight text-slate-deep tabular-nums">{formatNumberFor(lang, item.value)}</dd>
            <dt className="mt-1 text-xs leading-snug text-muted-foreground">{item.label}</dt>
          </div>
        ))}
      </dl>
      <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-teal opacity-50 motion-reduce:hidden" />
          <span className="relative inline-flex size-2 rounded-full bg-teal" />
        </span>
        {t.trust.live}
        {updatedAt ? ` · ${t.stats.updated} ${updatedAt.toLocaleTimeString(lang === "bn" ? "bn-BD" : "en-US", { hour: "2-digit", minute: "2-digit" })}` : ""}
      </p>
    </section>
  );
}

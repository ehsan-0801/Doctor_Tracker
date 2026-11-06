"use client";

import { useEffect, useState } from "react";
import { Building2, Stethoscope, Users } from "lucide-react";
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
    { label: t.stats.doctors, value: stats.doctors, icon: Stethoscope },
    { label: t.stats.specialities, value: stats.specializations, icon: Users },
    { label: t.stats.hospitals, value: stats.hospitals, icon: Building2 },
  ];

  return (
    <section aria-labelledby="live-stats-title" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <h2 id="live-stats-title" className="text-lg font-semibold">{t.stats.title}</h2>
          <p className="flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex size-2.5 rounded-full bg-success" />
            </span>
            {t.stats.live}
            {updatedAt ? ` · ${t.stats.updated} ${updatedAt.toLocaleTimeString(lang === "bn" ? "bn-BD" : "en-US", { hour: "2-digit", minute: "2-digit" })}` : ""}
          </p>
        </div>
        <dl className="grid gap-6 sm:grid-cols-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-xl bg-info-soft text-info-soft-foreground">
                <item.icon className="size-6" aria-hidden />
              </span>
              <div>
                <dd className="text-3xl font-bold tracking-tight tabular-nums">{formatNumberFor(lang, item.value)}</dd>
                <dt className="text-sm text-muted-foreground">{item.label}</dt>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

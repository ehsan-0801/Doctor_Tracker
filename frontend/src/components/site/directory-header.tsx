"use client";

import { localized } from "@/lib/i18n/dictionaries";
import { useLanguage } from "./language-provider";

export function DirectoryHeader({ hospitalName, hospitalNameBn }: { hospitalName: string; hospitalNameBn?: string }) {
  const { t, lang } = useLanguage();
  return (
    <header className="max-w-2xl space-y-2">
      <p className="text-sm font-semibold text-primary">{localized(lang, hospitalName, hospitalNameBn)}</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.directory.title}</h1>
      <p className="text-muted-foreground">{t.directory.description}</p>
    </header>
  );
}

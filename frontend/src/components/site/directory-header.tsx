"use client";

import { localized } from "@/lib/i18n/dictionaries";
import { useLanguage } from "./language-provider";

export function DirectoryHeader({ hospitalName, hospitalNameBn }: { hospitalName: string; hospitalNameBn?: string }) {
  const { t, lang } = useLanguage();
  return (
    <header className="bg-peach">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-12 lg:px-8">
        <div className="space-y-5 lg:col-span-7">
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.18em] text-slate-deep uppercase">
            <span className="h-px w-10 bg-coral-deep" aria-hidden />
            {localized(lang, hospitalName, hospitalNameBn)}
          </p>
          <h1 className="text-4xl leading-tight font-semibold tracking-tight text-slate-deep sm:text-5xl">{t.directory.title}</h1>
        </div>
        <p className="max-w-md self-end leading-relaxed text-slate-deep/80 lg:col-span-5">{t.directory.description}</p>
      </div>
    </header>
  );
}

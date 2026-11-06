"use client";

import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "./language-provider";

const OPTIONS = [
  { value: "en", label: "EN", name: "English" },
  { value: "bn", label: "বাং", name: "বাংলা" },
] as const;

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang, t } = useLanguage();
  return (
    <div role="group" aria-label={t.switchLanguage} className={cn("inline-flex items-center gap-0.5 rounded-md border bg-white p-0.5", className)}>
      <Languages className="ml-1.5 size-4 text-muted-foreground" aria-hidden />
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          lang={option.value}
          aria-pressed={lang === option.value}
          aria-label={option.name}
          onClick={() => setLang(option.value)}
          className={cn(
            "h-7 min-w-9 rounded px-2.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            lang === option.value ? "bg-coral text-slate-deep" : "text-muted-foreground hover:text-slate-deep",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

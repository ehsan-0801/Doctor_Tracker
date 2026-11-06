"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Menu, Phone, X } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "./language-provider";
import { LanguageToggle } from "./language-toggle";

const LINKS = [
  { key: "home", href: "/", section: null },
  { key: "findDoctor", href: "/find-a-doctor", section: null },
  { key: "services", href: "/#services", section: "services" },
  { key: "about", href: "/#about", section: "about" },
  { key: "contact", href: "/#contact", section: "contact" },
] as const;

type LinkKey = (typeof LINKS)[number]["key"];

/** Tracks which homepage section is in view so its nav link can be highlighted. */
function useActiveSection(enabled: boolean) {
  const [section, setSection] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const elements = LINKS.flatMap((l) => (l.section ? [document.getElementById(l.section)] : [])).filter(
      (el): el is HTMLElement => el !== null,
    );
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        const best = [...visible.entries()].sort((a, b) => b[1] - a[1])[0];
        setSection(best && best[1] > 0 ? best[0] : null);
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [enabled]);
  return enabled ? section : null;
}

export function SiteHeader({ emergencyPhone }: { emergencyPhone: string }) {
  const pathname = usePathname();
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const section = useActiveSection(pathname === "/");

  const activeKey: LinkKey | null =
    pathname === "/"
      ? ((LINKS.find((l) => l.section === section)?.key as LinkKey | undefined) ?? "home")
      : pathname.startsWith("/find-a-doctor")
        ? "findDoctor"
        : null;

  // Sliding active-link indicator, positioned directly on the DOM node (no re-render).
  const navRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const place = () => {
      const indicator = indicatorRef.current;
      const active = navRef.current?.querySelector<HTMLElement>('[aria-current="page"], [data-active="true"]');
      if (!indicator) return;
      if (!active) {
        indicator.style.opacity = "0";
        return;
      }
      indicator.style.opacity = "1";
      indicator.style.width = `${active.offsetWidth}px`;
      indicator.style.transform = `translateX(${active.offsetLeft}px)`;
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [activeKey, lang]);

  const tel = emergencyPhone.replace(/[^\d+]/g, "");

  return (
    <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="DocTrack" className="shrink-0 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          <Brand />
        </Link>

        <nav aria-label="Main" className="hidden flex-1 justify-center lg:flex">
          <div ref={navRef} className="relative flex items-center gap-1 rounded-full bg-muted/70 p-1">
            <span
              ref={indicatorRef}
              aria-hidden
              className="absolute top-1 bottom-1 left-0 rounded-full bg-card shadow-sm ring-1 ring-border transition-[transform,width,opacity] duration-300 ease-out motion-reduce:transition-none"
              style={{ opacity: 0 }}
            >
              <span className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-primary" />
            </span>
            {LINKS.map((link) => {
              const active = activeKey === link.key;
              const isPage = active && !link.section;
              return (
                <Link
                  key={link.key}
                  href={link.href}
                  aria-current={isPage ? "page" : undefined}
                  data-active={active}
                  className={cn(
                    "relative z-10 rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.nav[link.key]}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <LanguageToggle />
          {emergencyPhone && (
            <a href={`tel:${tel}`} className="hidden items-center gap-1.5 rounded-full bg-[var(--rose-soft)] px-3 py-1.5 text-sm font-medium text-destructive xl:flex">
              <Phone className="size-4" aria-hidden /> {emergencyPhone}
            </a>
          )}
          <Button asChild size="lg" className="h-10 rounded-full px-5">
            <Link href="/login">{t.staffSignIn}</Link>
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2 lg:hidden">
          <LanguageToggle />
          <Button
            variant="ghost"
            size="icon-lg"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="site-mobile-menu"
            aria-label={open ? t.closeMenu : t.openMenu}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <nav id="site-mobile-menu" aria-label="Main" className="border-t bg-card px-4 pb-4 lg:hidden">
          <ul className="space-y-1 py-2">
            {LINKS.map((link) => {
              const active = activeKey === link.key;
              return (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={active && !link.section ? "page" : undefined}
                    className={cn(
                      "flex h-12 items-center rounded-lg border-l-4 px-3 text-sm font-medium transition-colors",
                      active ? "border-primary bg-accent text-accent-foreground" : "border-transparent hover:bg-muted",
                    )}
                  >
                    {t.nav[link.key]}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="grid gap-2">
            {emergencyPhone && (
              <Button asChild variant="outline" size="lg" className="h-11 text-destructive">
                <a href={`tel:${tel}`}>
                  <Phone aria-hidden /> {t.emergency} {emergencyPhone}
                </a>
              </Button>
            )}
            <Button asChild size="lg" className="h-11">
              <Link href="/login">{t.staffSignIn}</Link>
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}

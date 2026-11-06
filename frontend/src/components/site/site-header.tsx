"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Phone, X } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/find-a-doctor", label: "Find a doctor" },
  { href: "/#services", label: "Services" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
];

export function SiteHeader({ emergencyPhone }: { emergencyPhone: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : !href.includes("#") && pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="DocTrack home" className="rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          <Brand />
        </Link>
        <nav aria-label="Main" className="hidden flex-1 items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                isActive(link.href) && "text-primary",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-3 md:flex">
          {emergencyPhone && (
            <a href={`tel:${emergencyPhone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-1.5 text-sm font-medium text-destructive">
              <Phone className="size-4" aria-hidden /> Emergency {emergencyPhone}
            </a>
          )}
          <Button asChild size="lg" className="h-10 px-4">
            <Link href="/login">Staff sign in</Link>
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon-lg"
          className="ml-auto md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="site-mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>
      {open && (
        <nav id="site-mobile-menu" aria-label="Main" className="border-t bg-card px-4 pb-4 md:hidden">
          <ul className="py-2">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} onClick={() => setOpen(false)} className="flex h-12 items-center rounded-md px-2 text-sm font-medium">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="h-11 w-full">
            <Link href="/login">Staff sign in</Link>
          </Button>
        </nav>
      )}
    </header>
  );
}

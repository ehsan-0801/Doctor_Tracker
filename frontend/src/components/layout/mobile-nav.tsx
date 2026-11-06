"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Brand } from "./brand";
import { isActivePath, NAV_ITEMS } from "./nav-items";
import { useLogout } from "./use-logout";

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { logout, pending } = useLogout();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="-ml-2 md:hidden" aria-label="Open navigation">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
        <SheetHeader className="h-16 justify-center px-5 text-white">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Main application navigation</SheetDescription>
          <Brand />
        </SheetHeader>
        <nav aria-label="Main navigation" className="flex-1 px-3 py-2">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <item.icon className="size-[18px]" aria-hidden />
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <button
            type="button"
            onClick={logout}
            disabled={pending}
            className="flex h-12 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground disabled:opacity-60"
          >
            <LogOut className="size-[18px]" aria-hidden />
            {pending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

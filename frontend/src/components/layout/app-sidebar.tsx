"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Brand } from "./brand";
import { useSession } from "@/hooks/use-session";
import { useUnreadCount } from "@/hooks/use-unread-count";
import { isActivePath, navItemsFor } from "./nav-items";
import { useLogout } from "./use-logout";

/**
 * Desktop (lg+): full 250px sidebar. Tablet (md–lg): 72px icon rail with tooltips.
 * Mobile uses the drawer in MobileNav instead.
 */
export function AppSidebar() {
  const pathname = usePathname();
  const { logout, pending } = useLogout();
  const session = useSession();
  const items = navItemsFor(session.user?.role, session.can);
  const unread = useUnreadCount();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[72px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex lg:w-[250px]">
      <div className="flex h-16 items-center px-4 text-white lg:px-5">
        <Brand className="lg:hidden" compact />
        <Brand className="hidden lg:flex" inverted />
      </div>

      <nav aria-label="Main navigation" className="flex-1 px-3 py-4">
        <p className="mb-2 hidden px-3 text-[11px] font-semibold tracking-wider text-sidebar-foreground/70 uppercase lg:block">Menu</p>
        <ul className="space-y-1">
          {items.map((item) => {
            const active = isActivePath(pathname, item.href);
            const link = (
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center justify-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none lg:justify-start",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="size-[18px] shrink-0" aria-hidden />
                <span className="sr-only lg:not-sr-only">{item.title}</span>
                {item.href === "/messages" && unread > 0 && (
                  <span className="ml-auto hidden h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-dot)] px-1.5 text-[11px] font-semibold text-sidebar lg:flex">
                    {unread > 99 ? "99+" : unread}
                    <span className="sr-only"> unread messages</span>
                  </span>
                )}
              </Link>
            );
            return (
              <li key={item.href}>
                <Tooltip>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right" className="lg:hidden">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
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
          className="flex h-11 w-full items-center justify-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none disabled:opacity-60 lg:justify-start"
        >
          <LogOut className="size-[18px] shrink-0" aria-hidden />
          <span className="sr-only lg:not-sr-only">{pending ? "Signing out…" : "Sign out"}</span>
        </button>
      </div>
    </aside>
  );
}

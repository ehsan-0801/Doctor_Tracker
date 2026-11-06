"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { authApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { Brand } from "./brand";
import { MobileNav } from "./mobile-nav";
import { isActivePath, NAV_ITEMS } from "./nav-items";
import { useLogout } from "./use-logout";

export function AppHeader() {
  const pathname = usePathname();
  const { logout, pending } = useLogout();
  const session = useQuery({ queryKey: queryKeys.session, queryFn: authApi.sessionOrRedirect, staleTime: 5 * 60_000 });
  const section = NAV_ITEMS.find((item) => isActivePath(pathname, item.href));
  const email = session.data?.admin.email;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:px-6 lg:px-8">
      <MobileNav />
      <Brand compact className="md:hidden" />
      <p className="hidden text-sm font-medium text-muted-foreground md:block">{section?.title ?? "Doctor Tracker"}</p>

      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex h-10 items-center gap-2 rounded-lg px-2 text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label="Account menu"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
              {email ? email[0]?.toUpperCase() : "A"}
            </span>
            <span className="hidden max-w-[200px] truncate font-medium sm:inline">
              {email ?? <Skeleton className="h-4 w-32" />}
            </span>
            <ChevronDown className="hidden size-4 text-muted-foreground sm:block" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="truncate text-sm font-medium">{email ?? "Administrator"}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={logout} disabled={pending}>
              <LogOut aria-hidden />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

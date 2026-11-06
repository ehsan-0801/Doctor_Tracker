"use client";

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
import { UserAvatar } from "@/components/shared/user-avatar";
import { useSession } from "@/hooks/use-session";
import { ROLE_LABELS } from "@/lib/permissions";
import { Brand } from "./brand";
import { MobileNav } from "./mobile-nav";
import { isActivePath, NAV_ITEMS } from "./nav-items";
import { useLogout } from "./use-logout";

export function AppHeader() {
  const pathname = usePathname();
  const { logout, pending } = useLogout();
  const { user } = useSession();
  const section = NAV_ITEMS.find((item) => isActivePath(pathname, item.href));
  const email = user?.email;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:px-6 lg:px-8">
      <MobileNav />
      <Brand compact className="md:hidden" />
      <p className="hidden text-sm font-medium text-muted-foreground md:block">{section?.title ?? "DocTrack"}</p>

      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex h-10 items-center gap-2 rounded-lg px-2 text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label="Account menu"
          >
            {user ? <UserAvatar name={user.name} photoUrl={user.photoUrl} /> : <span className="size-8 rounded-full bg-muted" />}
            <span className="hidden min-w-0 flex-col items-start leading-tight sm:flex">
              {user ? (
                <>
                  <span className="max-w-[200px] truncate font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</span>
                </>
              ) : (
                <Skeleton className="h-4 w-32" />
              )}
            </span>
            <ChevronDown className="hidden size-4 text-muted-foreground sm:block" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="truncate text-sm font-medium">{email ?? ""}</p>
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

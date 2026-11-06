import { Building2, ClipboardList, Globe, LayoutDashboard, MapPinned, MessagesSquare, Stethoscope, UserCog, Users, type LucideIcon } from "lucide-react";
import type { Permission } from "@/lib/permissions";
import type { Role } from "@/types/api";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Shown when the role has this permission… */
  permission?: Permission;
  /** …or when the role is one of these. */
  roles?: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard:read" },
  { title: "My patients", href: "/doctor", icon: ClipboardList, roles: ["doctor"] },
  { title: "Doctors", href: "/doctors", icon: Stethoscope, permission: "doctors:read" },
  { title: "Patients", href: "/patients", icon: Users, permission: "patients:read" },
  { title: "Live tracking", href: "/tracking", icon: MapPinned, roles: ["admin", "management", "staff", "doctor"] },
  { title: "Messages", href: "/messages", icon: MessagesSquare, roles: ["admin", "management", "staff", "doctor"] },
  { title: "Locations", href: "/locations", icon: Building2, permission: "locations:manage" },
  { title: "Users", href: "/users", icon: UserCog, permission: "users:manage" },
  { title: "Site settings", href: "/settings", icon: Globe, permission: "settings:manage" },
];

export function navItemsFor(role: Role | undefined, canDo: (p: Permission) => boolean): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter((item) => (item.permission ? canDo(item.permission) : item.roles?.includes(role)));
}

export const isActivePath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

import type { Role } from "@/types/api";

/**
 * Mirrors backend/src/constants/roles.ts. Used only to show or hide UI; the API
 * enforces every permission independently.
 */
const PERMISSIONS = {
  "dashboard:read": ["admin", "management", "staff"],
  "doctors:read": ["admin", "management", "staff"],
  "doctors:create": ["admin"],
  "doctors:update": ["admin"],
  "media:upload": ["admin"],
  "patients:read": ["admin", "management", "staff"],
  "patients:write": ["admin", "staff"],
  "patients:assign": ["admin", "staff"],
  "patients:delete": ["admin"],
  "users:manage": ["admin"],
  "settings:manage": ["admin"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | undefined, permission: Permission): boolean {
  return !!role && (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  management: "Management",
  staff: "Front desk",
  doctor: "Doctor",
};

/** Where each role lands after signing in. */
export function homeFor(role: Role): string {
  return role === "doctor" ? "/doctor" : "/dashboard";
}

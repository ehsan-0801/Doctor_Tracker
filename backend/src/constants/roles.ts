export const ROLES = ["admin", "management", "staff", "doctor"] as const;
export type Role = (typeof ROLES)[number];

/**
 * Capability → roles allowed. Routes check a capability, never a role name,
 * so changing who may do what is a one-line change here. Doctor access to
 * patient data is additionally scoped to their own patients in the services.
 */
export const PERMISSIONS = {
  "dashboard:read": ["admin", "management", "staff"],
  "doctors:read": ["admin", "management", "staff"],
  "doctors:create": ["admin"],
  "patients:read": ["admin", "management", "staff"],
  "patients:write": ["admin", "staff"],
  "patients:assign": ["admin", "staff"],
  "patients:delete": ["admin"],
  "users:manage": ["admin"],
  "settings:manage": ["admin"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

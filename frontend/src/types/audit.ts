import type { Role } from "./api";

export interface AuditEntry {
  _id: string;
  action: string;
  actorId: string | null;
  actorName: string;
  actorRole: Role | "";
  entityType: string;
  entityId: string | null;
  entityLabel: string;
  changes: Record<string, unknown> | null;
  ip: string;
  userAgent: string;
  createdAt: string;
}

export interface AppNotification {
  _id: string;
  type: "message" | "patient_assigned" | "patient_unassigned" | "location_updated" | "staff_assigned" | "system";
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
}

/** Human-readable action names for the audit log. */
export const ACTION_LABELS: Record<string, string> = {
  "auth.login": "Signed in",
  "auth.login_failed": "Failed sign-in",
  "auth.logout": "Signed out",
  "doctor.create": "Doctor created",
  "doctor.update": "Doctor updated",
  "patient.create": "Patient created",
  "patient.update": "Patient updated",
  "patient.delete": "Patient deleted",
  "patient.unassign": "Patient removed from doctor",
  "user.create": "User created",
  "user.update": "User updated",
  "user.deactivate": "User deactivated",
  "user.reactivate": "User reactivated",
  "user.reset_password": "Password reset",
  "settings.update": "Site settings updated",
  "location.create": "Room created",
  "location.update": "Room updated",
  "location.delete": "Room deleted",
  "presence.update": "Location set for someone",
};

export const actionLabel = (action: string) => ACTION_LABELS[action] ?? action;

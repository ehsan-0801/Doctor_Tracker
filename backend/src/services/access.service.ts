import type { Role } from "../constants/roles.js";
import type { AuthenticatedUser } from "./auth.service.js";

/** Minimal user shape for access decisions. */
export interface AccessSubject {
  id: string;
  role: Role;
  doctorId: string | null;
  assignedDoctorIds: string[];
}

const isSupportRole = (role: Role) => role === "staff" || role === "management";

/** Admin sees everyone's location; everyone else sees doctors only. */
export function canSeePresenceOf(actor: AuthenticatedUser, target: { role: Role }): boolean {
  return actor.role === "admin" || target.role === "doctor";
}

/** Self, admin, or staff/management assigned to that doctor. */
export function canSetPresenceOf(actor: AuthenticatedUser, target: AccessSubject): boolean {
  if (actor.id === target.id || actor.role === "admin") return true;
  return isSupportRole(actor.role) && target.role === "doctor" && !!target.doctorId && actor.assignedDoctorIds.includes(target.doctorId);
}

/** Admin ↔ anyone; doctor ↔ staff/management assigned to that doctor. */
export function canChat(a: AccessSubject, b: AccessSubject): boolean {
  if (a.id === b.id) return false;
  if (a.role === "admin" || b.role === "admin") return true;
  const [doctor, support] = a.role === "doctor" ? [a, b] : [b, a];
  return doctor.role === "doctor" && !!doctor.doctorId && isSupportRole(support.role) && support.assignedDoctorIds.includes(doctor.doctorId);
}

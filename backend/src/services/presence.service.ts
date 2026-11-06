import { Types } from "mongoose";
import type { Role } from "../constants/roles.js";
import { Doctor } from "../models/Doctor.js";
import { Location } from "../models/Location.js";
import { Presence, PresenceEvent } from "../models/Presence.js";
import { User } from "../models/User.js";
import { emitPresence } from "../realtime/server.js";
import { ApiError } from "../utils/ApiError.js";
import type { z } from "zod";
import type { setPresenceSchema } from "../validators/tracking.validator.js";
import { canSetPresenceOf } from "./access.service.js";
import type { AuthenticatedUser } from "./auth.service.js";

type LeanUser = {
  _id: Types.ObjectId;
  name: string;
  role: Role;
  photoUrl?: string | null;
  doctorId?: Types.ObjectId | null;
  assignedDoctorIds?: Types.ObjectId[] | null;
};

/** Builds the tracking view (user + current location) for the given users with batched lookups. */
async function buildViews(users: LeanUser[]) {
  const ids = users.map((u) => u._id);
  const presences = await Presence.find({ userId: { $in: ids } }).select("userId locationId status note updatedAt").lean();
  const locationIds = presences.flatMap((p) => (p.locationId ? [p.locationId] : []));
  const doctorIds = users.flatMap((u) => (u.doctorId ? [u.doctorId] : []));
  const [locations, doctors] = await Promise.all([
    Location.find({ _id: { $in: locationIds } }).select("name code type floor").lean(),
    Doctor.find({ _id: { $in: doctorIds } }).select("specialization").lean(),
  ]);
  const byUser = new Map(presences.map((p) => [p.userId.toString(), p]));
  const byLocation = new Map(locations.map((l) => [l._id.toString(), l]));
  const specialization = new Map(doctors.map((d) => [d._id.toString(), d.specialization]));

  return users.map((u) => {
    const p = byUser.get(u._id.toString());
    const location = p?.locationId ? byLocation.get(p.locationId.toString()) ?? null : null;
    return {
      userId: u._id.toString(),
      name: u.name,
      role: u.role,
      photoUrl: u.photoUrl ?? "",
      specialization: u.doctorId ? specialization.get(u.doctorId.toString()) ?? null : null,
      status: p?.status ?? "off_duty",
      note: p?.note ?? "",
      location: location && { _id: location._id.toString(), name: location.name, code: location.code, type: location.type, floor: location.floor },
      updatedAt: p?.updatedAt ?? null,
      canUpdate: false,
    };
  });
}

const USER_FIELDS = "name role photoUrl doctorId assignedDoctorIds";

/** Admin: every active user. Others: doctors, plus themselves (for "my status"). */
export async function listPresence(actor: AuthenticatedUser) {
  const filter: Record<string, unknown> =
    actor.role === "admin" ? { active: true } : { active: true, $or: [{ role: "doctor" }, { _id: new Types.ObjectId(actor.id) }] };
  const users = await User.find(filter).select(USER_FIELDS).sort({ role: 1, name: 1 }).lean<LeanUser[]>();
  const views = await buildViews(users);
  const subjects = new Map(users.map((u) => [u._id.toString(), u]));
  return views.map((v) => {
    const u = subjects.get(v.userId)!;
    return {
      ...v,
      canUpdate: canSetPresenceOf(actor, {
        id: v.userId,
        role: u.role,
        doctorId: u.doctorId?.toString() ?? null,
        assignedDoctorIds: (u.assignedDoctorIds ?? []).map(String),
      }),
    };
  });
}

export async function setPresence(actor: AuthenticatedUser, targetUserId: string, input: z.infer<typeof setPresenceSchema>) {
  const target = await User.findOne({ _id: targetUserId, active: true }).select(USER_FIELDS).lean<LeanUser>();
  if (!target) throw ApiError.notFound("User not found");
  const subject = {
    id: target._id.toString(),
    role: target.role,
    doctorId: target.doctorId?.toString() ?? null,
    assignedDoctorIds: (target.assignedDoctorIds ?? []).map(String),
  };
  if (!canSetPresenceOf(actor, subject)) throw ApiError.forbidden("You cannot update this person's location");

  if (input.locationId && !(await Location.exists({ _id: input.locationId, active: true }))) {
    throw ApiError.badRequest("Location not found", [{ field: "locationId", message: "Choose an existing location" }]);
  }
  const locationId = input.status === "off_duty" ? null : input.locationId;

  await Presence.updateOne(
    { userId: target._id },
    { $set: { locationId, status: input.status, note: input.note, updatedBy: actor.id } },
    { upsert: true },
  );
  await PresenceEvent.create({ userId: target._id, locationId, status: input.status, note: input.note, updatedBy: actor.id });

  const [view] = await buildViews([target]);
  emitPresence(view!);
  return { ...view!, canUpdate: true };
}

/** Admin: recent movements of one user (kept 30 days). */
export async function presenceHistory(userId: string, days: number) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const events = await PresenceEvent.find({ userId, createdAt: { $gte: since } })
    .sort({ createdAt: -1 })
    .limit(200)
    .populate({ path: "locationId", select: "name code type floor" })
    .populate({ path: "updatedBy", select: "name" })
    .lean();
  return events.map(({ locationId, updatedBy, ...e }) => ({ ...e, location: locationId ?? null, updatedBy: updatedBy ?? null }));
}

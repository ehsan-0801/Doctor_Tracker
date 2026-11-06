import type { QueryFilter } from "mongoose";
import { Doctor } from "../models/Doctor.js";
import { User, type UserDocument } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { containsPattern } from "../utils/query.js";
import { buildPagination } from "../utils/response.js";
import type { CreateUserInput, UpdateUserInput, UserListQuery } from "../validators/user.validator.js";
import { hashPassword, revokeUserSessions } from "./auth.service.js";

const PUBLIC_FIELDS = "name email role doctorId assignedDoctorIds active photoUrl lastLoginAt createdAt updatedAt";

/** Only staff/management can be assigned to doctors; ids must exist. */
async function resolveAssignments(role: string, ids: string[] | undefined) {
  if (role !== "staff" && role !== "management") return [];
  const unique = [...new Set(ids ?? [])];
  if (unique.length && (await Doctor.countDocuments({ _id: { $in: unique } })) !== unique.length) {
    throw ApiError.badRequest("One or more assigned doctors do not exist", [{ field: "assignedDoctorIds", message: "Remove doctors that no longer exist" }]);
  }
  return unique;
}
const DOCTOR_FIELDS = "name specialization";

export async function listUsers(query: UserListQuery) {
  const filter: QueryFilter<UserDocument> = {};
  if (query.search) {
    const pattern = containsPattern(query.search);
    filter.$or = [{ name: pattern }, { email: pattern }];
  }
  if (query.role) filter.role = query.role;
  if (query.status) filter.active = query.status === "active";

  const direction = query.sortOrder === "asc" ? 1 : -1;
  const [users, total] = await Promise.all([
    User.find(filter)
      .select(PUBLIC_FIELDS)
      .sort({ [query.sortBy]: direction, _id: direction })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .populate({ path: "doctorId", select: DOCTOR_FIELDS })
      .populate({ path: "assignedDoctorIds", select: "name" })
      .lean(),
    User.countDocuments(filter),
  ]);
  const data = users.map(({ doctorId: doctor, assignedDoctorIds: assigned, ...rest }) => ({
    ...rest,
    doctor: doctor ?? null,
    assignedDoctors: assigned ?? [],
  }));
  return { data, pagination: buildPagination(query.page, query.limit, total) };
}

async function getUser(id: string) {
  const user = await User.findById(id)
    .select(PUBLIC_FIELDS)
    .populate({ path: "doctorId", select: DOCTOR_FIELDS })
    .populate({ path: "assignedDoctorIds", select: "name" })
    .lean();
  if (!user) throw ApiError.notFound("User not found");
  const { doctorId: doctor, assignedDoctorIds: assigned, ...rest } = user;
  return { ...rest, doctor: doctor ?? null, assignedDoctors: assigned ?? [] };
}

/** A doctor login must point at an existing doctor that has no other login. */
async function assertDoctorLinkable(doctorId: string, exceptUserId?: string) {
  if (!(await Doctor.exists({ _id: doctorId }))) throw ApiError.notFound("Doctor not found");
  const taken = await User.exists({ doctorId, ...(exceptUserId ? { _id: { $ne: exceptUserId } } : {}) });
  if (taken) {
    throw ApiError.conflict("This doctor already has an account", [{ field: "doctorId", message: "Doctor already has an account" }]);
  }
}

export async function createUser(input: CreateUserInput) {
  if (await User.exists({ email: input.email })) {
    throw ApiError.conflict("A user with this email already exists", [{ field: "email", message: "Email is already in use" }]);
  }
  if (input.role === "doctor" && input.doctorId) await assertDoctorLinkable(input.doctorId);

  const user = await User.create({
    name: input.name,
    email: input.email,
    role: input.role,
    passwordHash: await hashPassword(input.password),
    doctorId: input.role === "doctor" ? input.doctorId : null,
    photoUrl: input.photoUrl ?? "",
    assignedDoctorIds: await resolveAssignments(input.role, input.assignedDoctorIds),
  });
  return getUser(user._id.toString());
}

/** Guards against the organization losing its last active administrator. */
async function assertNotLastAdmin(userId: string) {
  const otherAdmins = await User.countDocuments({ role: "admin", active: true, _id: { $ne: userId } });
  if (otherAdmins === 0) throw ApiError.badRequest("At least one active administrator is required");
}

export async function updateUser(id: string, input: UpdateUserInput, actorId: string) {
  const existing = await User.findById(id).select("role active doctorId").lean();
  if (!existing) throw ApiError.notFound("User not found");

  const role = input.role ?? existing.role;
  const losesAdmin = existing.role === "admin" && existing.active && (role !== "admin" || input.active === false);
  if (losesAdmin) {
    if (id === actorId) throw ApiError.badRequest("You cannot remove your own administrator access");
    await assertNotLastAdmin(id);
  }

  const doctorId = role === "doctor" ? (input.doctorId !== undefined ? input.doctorId : existing.doctorId?.toString() ?? null) : null;
  if (role === "doctor") {
    if (!doctorId) throw ApiError.badRequest("Select the doctor this account belongs to", [{ field: "doctorId", message: "Required for doctor accounts" }]);
    await assertDoctorLinkable(doctorId, id);
  }

  await User.updateOne(
    { _id: id },
    {
      ...(input.name !== undefined && { name: input.name }),
      role,
      doctorId,
      ...(input.active !== undefined && { active: input.active }),
      ...(input.photoUrl !== undefined && { photoUrl: input.photoUrl }),
      ...((input.assignedDoctorIds !== undefined || role !== existing.role) && {
        assignedDoctorIds: await resolveAssignments(role, input.assignedDoctorIds),
      }),
    },
  );

  // Access changed: force a fresh sign-in so the new permissions apply immediately.
  if (role !== existing.role || input.active === false || doctorId !== (existing.doctorId?.toString() ?? null)) {
    await revokeUserSessions(id);
  }
  return getUser(id);
}

export async function resetPassword(id: string, password: string) {
  const updated = await User.findByIdAndUpdate(id, { passwordHash: await hashPassword(password) }).select("_id").lean();
  if (!updated) throw ApiError.notFound("User not found");
  await revokeUserSessions(id);
}

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { Types } from "mongoose";
import { SESSION_TTL_MS } from "../constants/auth.js";
import type { Role } from "../constants/roles.js";
import { Session } from "../models/Session.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

const BCRYPT_ROUNDS = 12;
// Compared against when the email is unknown, so response time does not reveal
// whether an account exists.
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", BCRYPT_ROUNDS);

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  doctorId: string | null;
  photoUrl: string;
  /** Staff/management: doctor records they are assigned to. */
  assignedDoctorIds: string[];
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

function toAuthenticatedUser(user: {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: Role;
  doctorId?: Types.ObjectId | null;
  photoUrl?: string | null;
  assignedDoctorIds?: Types.ObjectId[] | null;
}): AuthenticatedUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    doctorId: user.doctorId ? user.doctorId.toString() : null,
    photoUrl: user.photoUrl ?? "",
    assignedDoctorIds: (user.assignedDoctorIds ?? []).map((id) => id.toString()),
  };
}

export async function login(email: string, password: string) {
  const user = await User.findOne({ email }).select("+passwordHash").lean();
  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  // Deactivated accounts get the same generic error as wrong credentials.
  if (!user || !passwordMatches || !user.active) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await Promise.all([
    Session.create({ tokenHash: hashToken(token), userId: user._id, expiresAt }),
    User.updateOne({ _id: user._id }, { lastLoginAt: new Date() }),
  ]);

  return { token, expiresAt, user: toAuthenticatedUser(user) };
}

export async function getSessionUser(token: string): Promise<AuthenticatedUser | null> {
  const session = await Session.findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } })
    .select("userId")
    .lean();
  if (!session) return null;

  const user = await User.findOne({ _id: session.userId, active: true }).select("name email role doctorId photoUrl assignedDoctorIds").lean();
  return user ? toAuthenticatedUser(user) : null;
}

export async function logout(token: string): Promise<void> {
  await Session.deleteOne({ tokenHash: hashToken(token) });
}

/** Sign a user out everywhere (deactivation, password reset, role change). */
export async function revokeUserSessions(userId: string): Promise<void> {
  await Session.deleteMany({ userId });
}

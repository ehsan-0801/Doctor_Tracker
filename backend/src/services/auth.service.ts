import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { SESSION_TTL_MS } from "../constants/auth.js";
import { Admin } from "../models/Admin.js";
import { Session } from "../models/Session.js";
import { ApiError } from "../utils/ApiError.js";

const BCRYPT_ROUNDS = 12;
// Compared against when the email is unknown, so response time does not reveal
// whether an account exists.
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", BCRYPT_ROUNDS);

export interface AuthenticatedAdmin {
  id: string;
  email: string;
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function login(email: string, password: string) {
  const admin = await Admin.findOne({ email }).select("+passwordHash").lean();
  const passwordMatches = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);

  if (!admin || !passwordMatches) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await Session.create({ tokenHash: hashToken(token), adminId: admin._id, expiresAt });

  return { token, expiresAt, admin: { id: admin._id.toString(), email: admin.email } };
}

export async function getSessionAdmin(token: string): Promise<AuthenticatedAdmin | null> {
  const session = await Session.findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } })
    .select("adminId")
    .lean();
  if (!session) return null;

  const admin = await Admin.findById(session.adminId).select("email").lean();
  return admin ? { id: admin._id.toString(), email: admin.email } : null;
}

export async function logout(token: string): Promise<void> {
  await Session.deleteOne({ tokenHash: hashToken(token) });
}

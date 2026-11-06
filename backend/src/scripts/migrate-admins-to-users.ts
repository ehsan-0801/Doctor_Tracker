/**
 * One-off migration: copy accounts from the legacy `admins` collection into
 * `users` with role "admin" (same password hash), then drop old sessions.
 * Idempotent: existing users with the same email are left untouched.
 * Rollback: the `admins` collection is not modified or deleted.
 *
 *   npx tsx --env-file=.env src/scripts/migrate-admins-to-users.ts
 */
import mongoose from "mongoose";
import { User } from "../models/User.js";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is required");

await mongoose.connect(uri);
const db = mongoose.connection.db!;
await User.syncIndexes();

const admins = await db.collection("admins").find().toArray();
let created = 0;
for (const admin of admins) {
  const exists = await User.exists({ email: admin.email });
  if (exists) continue;
  await User.collection.insertOne({
    name: "Administrator",
    email: admin.email,
    passwordHash: admin.passwordHash,
    role: "admin",
    doctorId: null,
    active: true,
    lastLoginAt: null,
    createdAt: admin.createdAt ?? new Date(),
    updatedAt: new Date(),
  });
  created += 1;
}
// Sessions referenced `adminId`; they cannot be resolved any more, so remove them.
const sessions = await db.collection("sessions").deleteMany({ userId: { $exists: false } });
console.log(`Migrated ${created} of ${admins.length} admin account(s); removed ${sessions.deletedCount} legacy session(s).`);
await mongoose.disconnect();

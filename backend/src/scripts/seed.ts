/**
 * Seed script.
 *   npm run seed            -> creates the admin (if missing) and demo data (if no doctors exist)
 *   npm run seed -- --reset -> also deletes all doctors and patients, re-creates demo data,
 *                              and resets the admin password to ADMIN_PASSWORD
 *   npm run seed -- --admin-only
 *
 * The admin is created from ADMIN_EMAIL / ADMIN_PASSWORD. Without --reset an
 * existing admin's password is never overwritten.
 *
 * Demo data also creates one account per role, all using ADMIN_PASSWORD:
 *   management@doctortracker.com, staff@doctortracker.com, and a doctor login
 *   for every seeded doctor (the doctor's own email).
 */
import { z } from "zod";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { PRESET_CONDITIONS } from "../constants/conditions.js";
import { Doctor } from "../models/Doctor.js";
import { Patient } from "../models/Patient.js";
import { User } from "../models/User.js";
import { hashPassword } from "../services/auth.service.js";

const seedEnv = z
  .object({
    MONGODB_URI: z.string().min(1),
    ADMIN_EMAIL: z.string().trim().toLowerCase().pipe(z.email()),
    ADMIN_PASSWORD: z.string().min(8, "ADMIN_PASSWORD must be at least 8 characters"),
  })
  .parse(process.env);

const args = new Set(process.argv.slice(2));

// Deterministic pseudo-random generator so every seed produces the same data set.
let state = 20260101;
const random = () => {
  state = (state * 1664525 + 1013904223) % 4294967296;
  return state / 4294967296;
};
const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)] as T;

const DOCTORS = [
  ["Dr. Amelia Hart", "Cardiology", "Riverside General Hospital"],
  ["Dr. Rahim Chowdhury", "Endocrinology", "Lakeside Medical Center"],
  ["Dr. Sofia Marin", "Pulmonology", "Riverside General Hospital"],
  ["Dr. Daniel Okafor", "Nephrology", "Northgate Clinic"],
  ["Dr. Priya Raman", "Neurology", "Lakeside Medical Center"],
  ["Dr. Lucas Bennett", "Rheumatology", "St. Clare Hospital"],
  ["Dr. Nadia Karim", "Psychiatry", "Northgate Clinic"],
  ["Dr. Ethan Brooks", "General Medicine", "St. Clare Hospital"],
  ["Dr. Hana Sato", "Cardiology", "Lakeside Medical Center"],
  ["Dr. Omar Haddad", "Endocrinology", "Riverside General Hospital"],
  ["Dr. Grace Liu", "Neurology", "St. Clare Hospital"],
  ["Dr. Mateo Silva", "General Medicine", "Northgate Clinic"],
  ["Dr. Farhana Islam", "Pulmonology", "St. Clare Hospital"],
  ["Dr. Jonas Weber", "Psychiatry", "Riverside General Hospital"],
  ["Dr. Leila Ahmadi", "Rheumatology", "Lakeside Medical Center"],
] as const;

const SPECIALTY_CONDITIONS: Record<string, readonly string[]> = {
  Cardiology: ["Hypertension", "Heart Disease"],
  Endocrinology: ["Diabetes", "Thyroid Disorder"],
  Pulmonology: ["Asthma", "COPD"],
  Nephrology: ["Chronic Kidney Disease", "Hypertension"],
  Neurology: ["Migraine", "Epilepsy"],
  Rheumatology: ["Arthritis", "Lupus"],
  Psychiatry: ["Anxiety", "Depression"],
  "General Medicine": PRESET_CONDITIONS,
};

const FIRST_NAMES = ["Ava", "Liam", "Noah", "Mia", "Zara", "Arif", "Elena", "Kofi", "Yuki", "Ines", "Ravi", "Maya", "Leo", "Sara", "Tariq", "Nora", "Ivan", "Lina", "Hugo", "Amara", "Sami", "Chloe", "Jun", "Rosa"];
const LAST_NAMES = ["Ahmed", "Garcia", "Nguyen", "Smith", "Rossi", "Khan", "Müller", "Haque", "Tanaka", "Dubois", "Mensah", "Patel", "Novak", "Costa", "Rahman", "Larsen", "Ortiz", "Begum"];

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY_MS - Math.floor(random() * DAY_MS));

async function seedAdmin() {
  const existing = await User.exists({ email: seedEnv.ADMIN_EMAIL });
  if (existing && args.has("--reset")) {
    await User.updateOne(
      { _id: existing._id },
      { passwordHash: await hashPassword(seedEnv.ADMIN_PASSWORD), role: "admin", active: true },
    );
    console.log(`Admin ${seedEnv.ADMIN_EMAIL} password reset`);
    return;
  }
  if (existing) {
    console.log(`Admin ${seedEnv.ADMIN_EMAIL} already exists (password unchanged)`);
    return;
  }
  await User.create({
    name: "Administrator",
    email: seedEnv.ADMIN_EMAIL,
    role: "admin",
    passwordHash: await hashPassword(seedEnv.ADMIN_PASSWORD),
  });
  console.log(`Admin ${seedEnv.ADMIN_EMAIL} created`);
}

/** One demo login per role; doctor logins are linked to their doctor records. */
async function seedDemoUsers(doctors: { _id: unknown; name: string; email: string }[]) {
  const passwordHash = await hashPassword(seedEnv.ADMIN_PASSWORD);
  const staffAccounts = [
    { name: "Morgan Lee", email: "management@doctortracker.com", role: "management" },
    { name: "Sam Rivera", email: "staff@doctortracker.com", role: "staff" },
  ];
  for (const account of staffAccounts) {
    await User.updateOne({ email: account.email }, { $set: { ...account, passwordHash, active: true } }, { upsert: true });
  }
  await User.insertMany(
    doctors.map((d) => ({ name: d.name, email: d.email, role: "doctor", doctorId: d._id, passwordHash })),
  );
  console.log(`Created demo accounts: management, staff and ${doctors.length} doctors (password = ADMIN_PASSWORD)`);
}

async function seedDemoData() {
  if (args.has("--reset")) {
    await Promise.all([Patient.deleteMany({}), Doctor.deleteMany({}), User.deleteMany({ role: "doctor" })]);
    console.log("Existing doctors and patients removed");
  } else if (await Doctor.exists({})) {
    console.log("Doctors already exist, skipping demo data (use --reset to recreate)");
    return;
  }

  const doctorDocs = DOCTORS.map(([name, specialization, hospital], index) => {
    const createdAt = daysAgo(360 - index * 18);
    const slug = name.replace(/^Dr\.\s*/, "").toLowerCase().replace(/[^a-z]+/g, ".");
    return {
      name,
      specialization,
      hospital,
      phone: `+1 555 01${String(index).padStart(2, "0")} ${String(1000 + index * 37).slice(0, 4)}`,
      email: `${slug}@example.com`,
      createdAt,
      updatedAt: createdAt,
    };
  });
  const doctors = await Doctor.insertMany(doctorDocs, { timestamps: false });

  const patients = [];
  for (let i = 0; i < 180; i++) {
    // Skew the distribution so some doctors carry noticeably more patients.
    const doctor = doctors[Math.floor(random() ** 1.6 * doctors.length)]!;
    const doctorAgeDays = Math.floor((Date.now() - doctor.createdAt.getTime()) / DAY_MS);
    // More recent registrations than older ones, never before the doctor joined.
    const createdAt = daysAgo(Math.floor(random() ** 1.4 * doctorAgeDays));
    patients.push({
      name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      condition: pick(SPECIALTY_CONDITIONS[doctor.specialization] ?? PRESET_CONDITIONS),
      // About 5% of patients are unassigned, as if removed from a doctor's list.
      doctorId: random() < 0.05 ? null : doctor._id,
      createdAt,
      updatedAt: createdAt,
    });
  }
  await Patient.insertMany(patients, { timestamps: false });
  console.log(`Created ${doctors.length} doctors and ${patients.length} patients`);
  await seedDemoUsers(doctors);
}

async function main() {
  await connectDatabase(seedEnv.MONGODB_URI);
  await Promise.all([User.syncIndexes(), Doctor.syncIndexes(), Patient.syncIndexes()]);
  await seedAdmin();
  if (!args.has("--admin-only")) await seedDemoData();
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());

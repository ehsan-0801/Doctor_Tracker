/**
 * Seed script.
 *   npm run seed            -> creates the admin (if missing) and demo data (if no doctors exist)
 *   npm run seed -- --reset -> also deletes all doctors and patients, re-creates demo data,
 *                              and resets the admin password to ADMIN_PASSWORD
 *   npm run seed -- --admin-only
 *   npm run seed -- --tracking-only -> (re)creates rooms, live statuses, staff
 *                              assignments and sample chats; doctors/patients untouched
 *
 * The admin is created from ADMIN_EMAIL / ADMIN_PASSWORD. Without --reset an
 * existing admin's password is never overwritten.
 *
 * When CLOUDINARY_URL is valid, portraits in seed-assets/photos (Unsplash
 * License; see seed-assets/photos/CREDITS.txt) are uploaded to DocTrack/doctors
 * and DocTrack/staff and attached to doctors and accounts; otherwise photos are
 * skipped. The people shown are stock models presented as fictional demo staff.
 *
 * Demo data also creates one account per role, all using ADMIN_PASSWORD:
 *   management@doctortracker.com, staff@doctortracker.com, and a doctor login
 *   for every seeded doctor (the doctor's own email).
 */
import { readFile } from "node:fs/promises";
import type { Types } from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { parseCloudinaryUrl, signParams } from "../config/cloudinary.js";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { PRESET_CONDITIONS } from "../constants/conditions.js";
import { Doctor } from "../models/Doctor.js";
import { Patient } from "../models/Patient.js";
import { User } from "../models/User.js";
import { Conversation, Message } from "../models/Chat.js";
import { Location } from "../models/Location.js";
import { Presence, PresenceEvent } from "../models/Presence.js";
import { hashPassword } from "../services/auth.service.js";
import { issueAccessToken } from "../services/patient.service.js";

const DEMO_PATIENT_TOKEN = "DEMO-CARE-2026";

const seedEnv = z
  .object({
    MONGODB_URI: z.string().min(1),
    ADMIN_EMAIL: z.string().trim().toLowerCase().pipe(z.email()),
    ADMIN_PASSWORD: z.string().min(8, "ADMIN_PASSWORD must be at least 8 characters"),
    CLOUDINARY_URL: z.string().optional(),
  })
  .parse(process.env);

const args = new Set(process.argv.slice(2));
const PATIENT_COUNT = 60;
const PHOTO_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../seed-assets/photos");
const slugify = (name: string) => name.replace(/^Dr\.\s*/, "").toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");

/**
 * Uploads seed portraits to Cloudinary once per run (fixed public ids, so reruns
 * overwrite instead of duplicating). Returns slug -> https URL, or an empty map
 * when Cloudinary is not configured or rejects the credentials.
 */
async function uploadPhotos(entries: { slug: string; folder: "DocTrack/doctors" | "DocTrack/staff" }[]) {
  const urls = new Map<string, string>();
  const cloudinary = parseCloudinaryUrl(seedEnv.CLOUDINARY_URL);
  if (!cloudinary) {
    console.warn("CLOUDINARY_URL not set or invalid: skipping photos");
    return urls;
  }
  for (const { slug, folder } of entries) {
    const params = { folder, overwrite: "true", public_id: slug, timestamp: Math.floor(Date.now() / 1000) };
    const form = new FormData();
    form.append("file", new Blob([await readFile(path.join(PHOTO_DIR, `${slug}.jpg`))], { type: "image/jpeg" }), `${slug}.jpg`);
    for (const [key, value] of Object.entries(params)) form.append(key, String(value));
    form.append("api_key", cloudinary.apiKey);
    form.append("signature", signParams(params, cloudinary.apiSecret));
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/image/upload`, { method: "POST", body: form });
    const body = (await res.json()) as { secure_url?: string; error?: { message: string } };
    if (!res.ok || !body.secure_url) {
      console.warn(`Photo upload failed (${body.error?.message ?? res.status}): skipping photos`);
      return new Map<string, string>();
    }
    urls.set(slug, body.secure_url);
  }
  console.log(`Uploaded ${urls.size} photos to Cloudinary`);
  return urls;
}

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

/** Demo hospital layout: [name, code, type, floor, x, y, w, h] on a 40×22 grid. */
const LOCATIONS = [
  ["Reception", "REC", "reception", 0, 0, 0, 10, 7],
  ["Emergency", "ER", "emergency", 0, 10, 0, 12, 9],
  ["Pharmacy", "PHA", "pharmacy", 0, 22, 0, 8, 7],
  ["Radiology", "RAD", "radiology", 0, 30, 0, 10, 9],
  ["Laboratory", "LAB", "lab", 0, 0, 7, 10, 7],
  ["Admin Office", "ADM", "office", 0, 30, 9, 10, 5],
  ["Consultation 1", "C-1", "consultation", 0, 0, 15, 10, 7],
  ["Consultation 2", "C-2", "consultation", 0, 10, 15, 10, 7],
  ["Consultation 3", "C-3", "consultation", 0, 20, 15, 10, 7],
  ["Consultation 4", "C-4", "consultation", 0, 30, 15, 10, 7],
  ["Operation Theatre 1", "OT-1", "ot", 1, 0, 0, 10, 9],
  ["Operation Theatre 2", "OT-2", "ot", 1, 10, 0, 10, 9],
  ["Intensive Care Unit", "ICU", "icu", 1, 20, 0, 20, 9],
  ["Ward A", "W-A", "ward", 1, 0, 11, 14, 11],
  ["Ward B", "W-B", "ward", 1, 14, 11, 14, 11],
  ["Doctors' Lounge", "LNG", "lounge", 1, 28, 11, 12, 11],
] as const;

/** Where each demo doctor is right now: [location code | null, status, note]. */
const DOCTOR_PRESENCE: [string | null, string, string][] = [
  ["OT-1", "in_surgery", "Coronary bypass"],
  ["C-1", "available", ""],
  ["ICU", "busy", "ICU rounds"],
  ["C-2", "busy", "Dialysis review"],
  ["OT-2", "in_surgery", "Neurosurgery assist"],
  ["W-A", "busy", "Ward rounds"],
  ["C-3", "available", ""],
  ["ER", "busy", "Emergency cover"],
  ["W-B", "busy", "Ward rounds"],
  ["LNG", "on_break", ""],
  ["C-4", "available", ""],
  [null, "off_duty", ""],
  ["RAD", "busy", "Reviewing scans"],
  ["LNG", "on_break", ""],
  [null, "off_duty", ""],
];

/** Live tracking demo: rooms, current locations, staff assignments and sample chats. */
async function seedTracking() {
  await Promise.all([Location.deleteMany({}), Presence.deleteMany({}), PresenceEvent.deleteMany({}), Conversation.deleteMany({}), Message.deleteMany({})]);
  const locations = await Location.insertMany(LOCATIONS.map(([name, code, type, floor, x, y, w, h]) => ({ name, code, type, floor, x, y, w, h })));
  const byCode = new Map<string, Types.ObjectId>(locations.map((l) => [l.code as string, l._id]));

  const doctors = await Doctor.find().sort({ createdAt: 1 }).select("_id").lean();
  const doctorUsers = await User.find({ role: "doctor" }).select("_id doctorId").lean();
  const userByDoctor = new Map(doctorUsers.map((u) => [u.doctorId!.toString(), u._id]));
  const [sam, morgan, admin] = await Promise.all([
    User.findOne({ email: "staff@doctortracker.com" }).select("_id").lean(),
    User.findOne({ email: "management@doctortracker.com" }).select("_id").lean(),
    User.findOne({ email: seedEnv.ADMIN_EMAIL }).select("_id").lean(),
  ]);

  // Front desk supports the first 8 doctors, management the rest.
  if (sam) await User.updateOne({ _id: sam._id }, { assignedDoctorIds: doctors.slice(0, 8).map((d) => d._id) });
  if (morgan) await User.updateOne({ _id: morgan._id }, { assignedDoctorIds: doctors.slice(8).map((d) => d._id) });

  const presences = doctors.flatMap((d, i) => {
    const userId = userByDoctor.get(d._id.toString());
    const [code, status, note] = DOCTOR_PRESENCE[i % DOCTOR_PRESENCE.length]!;
    return userId ? [{ userId, locationId: code ? byCode.get(code) : null, status, note }] : [];
  });
  if (sam) presences.push({ userId: sam._id, locationId: byCode.get("REC")!, status: "available", note: "Front desk" });
  if (morgan) presences.push({ userId: morgan._id, locationId: byCode.get("ADM")!, status: "busy", note: "" });
  if (admin) presences.push({ userId: admin._id, locationId: byCode.get("ADM")!, status: "available", note: "" });
  await Presence.insertMany(presences);
  await PresenceEvent.insertMany(presences.map((p) => ({ ...p, updatedBy: p.userId })));

  // Sample conversations.
  const firstDoctorUser = doctors[0] && userByDoctor.get(doctors[0]._id.toString());
  const threads: [Types.ObjectId, Types.ObjectId, [Types.ObjectId, string][]][] = [];
  if (firstDoctorUser && sam) {
    threads.push([firstDoctorUser, sam._id, [
      [sam._id, "Good morning Doctor, your 10:30 patient has checked in at reception."],
      [firstDoctorUser, "Thanks Sam. I'm finishing in OT-1, please ask them to wait in Consultation 1."],
      [sam._id, "Will do. I'll let you know when the scan results arrive."],
    ]]);
  }
  if (admin && morgan) {
    threads.push([admin._id, morgan._id, [
      [admin._id, "Morgan, can you review this week's ward staffing before Friday?"],
      [morgan._id, "Yes, I'll send the plan by Thursday afternoon."],
    ]]);
  }
  let minutesAgo = threads.length * 30;
  for (const [a, b, messages] of threads) {
    const key = [String(a), String(b)].sort().join(":");
    const conversation = await Conversation.create({ key, participants: [a, b] });
    let last: Date = new Date();
    for (const [senderId, body] of messages) {
      last = new Date(Date.now() - minutesAgo-- * 60_000);
      await Message.create({ conversationId: conversation._id, senderId, body, createdAt: last });
    }
    const lastMessage = messages.at(-1)!;
    await Conversation.updateOne({ _id: conversation._id }, { lastMessage: lastMessage[1], lastMessageAt: last, lastSenderId: lastMessage[0], reads: [{ userId: lastMessage[0], at: last }] });
  }
  console.log(`Created ${locations.length} locations, ${presences.length} live statuses and ${threads.length} sample conversations`);
}
const daysAgo = (days: number) => new Date(Date.now() - days * DAY_MS - Math.floor(random() * DAY_MS));

async function seedAdmin(photoUrl = "") {
  const existing = await User.exists({ email: seedEnv.ADMIN_EMAIL });
  if (existing && args.has("--reset")) {
    await User.updateOne(
      { _id: existing._id },
      { passwordHash: await hashPassword(seedEnv.ADMIN_PASSWORD), role: "admin", active: true, ...(photoUrl && { photoUrl }) },
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
    photoUrl,
  });
  console.log(`Admin ${seedEnv.ADMIN_EMAIL} created`);
}

/** One demo login per role; doctor logins are linked to their doctor records. */
async function seedDemoUsers(doctors: { _id: unknown; name: string; email: string; photoUrl?: string }[], photos: Map<string, string>) {
  const passwordHash = await hashPassword(seedEnv.ADMIN_PASSWORD);
  const staffAccounts = [
    { name: "Morgan Lee", email: "management@doctortracker.com", role: "management", photoUrl: photos.get("morgan-lee") ?? "" },
    { name: "Sam Rivera", email: "staff@doctortracker.com", role: "staff", photoUrl: photos.get("sam-rivera") ?? "" },
  ];
  for (const account of staffAccounts) {
    await User.updateOne({ email: account.email }, { $set: { ...account, passwordHash, active: true } }, { upsert: true });
  }
  await User.insertMany(
    doctors.map((d) => ({ name: d.name, email: d.email, role: "doctor", doctorId: d._id, passwordHash, photoUrl: d.photoUrl ?? "" })),
  );
  console.log(`Created demo accounts: management, staff and ${doctors.length} doctors (password = ADMIN_PASSWORD)`);
}

async function seedDemoData(photos: Map<string, string>) {
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
      photoUrl: photos.get(slugify(name)) ?? "",
      createdAt,
      updatedAt: createdAt,
    };
  });
  const doctors = await Doctor.insertMany(doctorDocs, { timestamps: false });

  const patients = [];
  for (let i = 0; i < PATIENT_COUNT; i++) {
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
  const created = await Patient.insertMany(patients, { timestamps: false });
  console.log(`Created ${doctors.length} doctors and ${patients.length} patients`);
  // One patient gets a known token so the public status page can be demoed.
  const demoPatient = created.find((p) => p.doctorId) ?? created[0]!;
  await issueAccessToken(demoPatient._id.toString(), DEMO_PATIENT_TOKEN);
  console.log(`Patient status demo: name "${demoPatient.name}", token ${DEMO_PATIENT_TOKEN}`);
  await seedDemoUsers(doctors, photos);
  await seedTracking();
}

async function main() {
  await connectDatabase(seedEnv.MONGODB_URI);
  await Promise.all([User.syncIndexes(), Doctor.syncIndexes(), Patient.syncIndexes(), Location.syncIndexes(), Presence.syncIndexes(), PresenceEvent.syncIndexes(), Conversation.syncIndexes(), Message.syncIndexes()]);
  const photos = args.has("--tracking-only") ? new Map<string, string>() : await uploadPhotos([
    ...DOCTORS.map(([name]) => ({ slug: slugify(name), folder: "DocTrack/doctors" as const })),
    ...["administrator", "morgan-lee", "sam-rivera"].map((slug) => ({ slug, folder: "DocTrack/staff" as const })),
  ]);
  if (args.has("--tracking-only")) {
    await seedTracking();
    return;
  }
  await seedAdmin(photos.get("administrator") ?? "");
  if (!args.has("--admin-only")) await seedDemoData(photos);
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());

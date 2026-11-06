import { createHash, randomInt } from "node:crypto";
import { Types, type QueryFilter } from "mongoose";
import { normalizeCondition, PRESET_CONDITIONS } from "../constants/conditions.js";
import { Patient, type PatientDocument } from "../models/Patient.js";
import { ApiError } from "../utils/ApiError.js";
import { containsPattern, dateRangeFilter } from "../utils/query.js";
import { buildPagination } from "../utils/response.js";
import type { PatientListQuery, UpdatePatientInput } from "../validators/patient.validator.js";
import { assertDoctorExists } from "./doctor.service.js";
import { doctorUserIds, notify } from "./notification.service.js";

const CASE_INSENSITIVE = { locale: "en", strength: 2 } as const;
const DOCTOR_FIELDS = "name specialization hospital";
const PATIENT_FIELDS = "name condition doctorId accessTokenIssuedAt createdAt updatedAt";

/**
 * Resolve a condition to its canonical spelling: a preset, an existing stored
 * value that differs only by case, or the normalized input.
 */
async function canonicalCondition(value: string): Promise<string> {
  const normalized = normalizeCondition(value);
  if ((PRESET_CONDITIONS as readonly string[]).includes(normalized)) return normalized;
  const existing = await Patient.findOne({ condition: normalized })
    .collation(CASE_INSENSITIVE)
    .select("condition")
    .lean();
  return existing?.condition ?? normalized;
}

function buildListFilter(query: PatientListQuery, doctorId?: string): QueryFilter<PatientDocument> {
  const filter: QueryFilter<PatientDocument> = {};
  if (query.search) filter.name = containsPattern(query.search);
  // Stored conditions are canonical, so the filter value is normalized the same way
  // and matched exactly (index-backed).
  if (query.condition) filter.condition = normalizeCondition(query.condition);
  const scopedDoctor = doctorId ?? query.doctorId;
  if (scopedDoctor === "unassigned") filter.doctorId = null;
  else if (scopedDoctor) filter.doctorId = new Types.ObjectId(scopedDoctor);
  const createdAt = dateRangeFilter(query.startDate, query.endDate);
  if (createdAt) filter.createdAt = createdAt;
  return filter;
}

/** Paginated patients, optionally scoped to one doctor. */
export async function listPatients(query: PatientListQuery, doctorId?: string) {
  const filter = buildListFilter(query, doctorId);
  const direction = query.sortOrder === "asc" ? 1 : -1;
  const sort = { [query.sortBy]: direction, _id: direction } as const;

  const [patients, total] = await Promise.all([
    Patient.find(filter)
      .select(PATIENT_FIELDS)
      .sort(sort)
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      // One batched $in query for the page's doctors, not one per patient.
      .populate({ path: "doctorId", select: DOCTOR_FIELDS })
      .lean(),
    Patient.countDocuments(filter),
  ]);

  const data = patients.map(({ doctorId: doctor, ...rest }) => ({ ...rest, doctor: doctor ?? null }));
  return { data, pagination: buildPagination(query.page, query.limit, total) };
}

export async function getPatientById(id: string) {
  const patient = await Patient.findById(id)
    .select(PATIENT_FIELDS)
    .populate({ path: "doctorId", select: DOCTOR_FIELDS })
    .lean();
  if (!patient) throw ApiError.notFound("Patient not found");
  const { doctorId: doctor, ...rest } = patient;
  return { ...rest, doctor: doctor ?? null };
}

export async function createPatient(input: { name: string; condition: string; doctorId: string }) {
  await assertDoctorExists(input.doctorId);
  const patient = await Patient.create({
    name: input.name,
    condition: await canonicalCondition(input.condition),
    doctorId: input.doctorId,
  });
  await notify(await doctorUserIds(input.doctorId), {
    type: "patient_assigned",
    title: "New patient assigned",
    body: `${patient.name} (${patient.condition}) was added to your patients.`,
    link: "/doctor",
  });
  return getPatientById(patient._id.toString());
}

export async function updatePatient(id: string, input: UpdatePatientInput) {
  if (input.doctorId) await assertDoctorExists(input.doctorId);

  const update: Partial<{ name: string; condition: string; doctorId: string | null }> = {};
  if (input.name !== undefined) update.name = input.name;
  if (input.condition !== undefined) update.condition = await canonicalCondition(input.condition);
  if (input.doctorId !== undefined) update.doctorId = input.doctorId;

  const previous = await Patient.findByIdAndUpdate(id, update, { runValidators: true }).select("name doctorId").lean();
  if (!previous) throw ApiError.notFound("Patient not found");

  // Tell doctors when a patient moves onto or off their list.
  const before = previous.doctorId?.toString() ?? null;
  if (input.doctorId !== undefined && input.doctorId !== before) {
    const name = update.name ?? previous.name;
    await Promise.all([
      notify(await doctorUserIds(before), { type: "patient_unassigned", title: "Patient reassigned", body: `${name} is no longer on your list.`, link: "/doctor" }),
      notify(await doctorUserIds(input.doctorId), { type: "patient_assigned", title: "New patient assigned", body: `${name} was added to your patients.`, link: "/doctor" }),
    ]);
  }
  return getPatientById(id);
}

export async function deletePatient(id: string): Promise<void> {
  const deleted = await Patient.findByIdAndDelete(id).select("_id").lean();
  if (!deleted) throw ApiError.notFound("Patient not found");
}

/** Remove the doctor association only; the patient record is kept as unassigned. */
export async function unassignPatient(doctorId: string, patientId: string) {
  const updated = await Patient.findOneAndUpdate(
    { _id: patientId, doctorId },
    { doctorId: null },
  )
    .select("_id")
    .lean();
  if (!updated) throw ApiError.notFound("Patient is not associated with this doctor");
  const patient = await getPatientById(patientId);
  await notify(await doctorUserIds(doctorId), { type: "patient_unassigned", title: "Patient removed from your list", body: `${patient.name} was removed from your patients.`, link: "/doctor" });
  return patient;
}

/** Presets plus every condition stored in the database, for filters and form suggestions. */
export async function listConditions(): Promise<string[]> {
  const stored: string[] = await Patient.distinct("condition");
  const merged = new Map<string, string>();
  for (const value of [...PRESET_CONDITIONS, ...stored]) {
    const key = value.toLowerCase();
    if (!merged.has(key)) merged.set(key, value);
  }
  return [...merged.values()].sort((a, b) => a.localeCompare(b));
}

// Unambiguous characters only (no 0/O, 1/I/L), so a token read aloud or copied
// from paper is typed correctly. 12 characters ≈ 59 bits.
const TOKEN_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const TOKEN_LENGTH = 12;

/** Case, spaces and dashes do not matter when a patient types their token. */
const normalizeToken = (token: string) => token.toUpperCase().replace(/[^A-Z0-9]/g, "");
const hashAccessToken = (token: string) => createHash("sha256").update(normalizeToken(token)).digest("hex");
const normalizeName = (name: string) => name.trim().replace(/\s+/g, " ").toLocaleLowerCase("en");

function generateAccessToken() {
  const chars = Array.from({ length: TOKEN_LENGTH }, () => TOKEN_ALPHABET[randomInt(TOKEN_ALPHABET.length)]).join("");
  return chars.match(/.{4}/g)!.join("-");
}

/**
 * Issues a new status-check token, replacing any previous one. The plain token
 * is returned once and never stored.
 */
export async function issueAccessToken(id: string, token = generateAccessToken()) {
  const issuedAt = new Date();
  const patient = await Patient.findByIdAndUpdate(id, { accessTokenHash: hashAccessToken(token), accessTokenIssuedAt: issuedAt }, { timestamps: false })
    .select("name")
    .lean();
  if (!patient) throw ApiError.notFound("Patient not found");
  return { token, issuedAt, patientName: patient.name };
}

export async function revokeAccessToken(id: string) {
  const patient = await Patient.findByIdAndUpdate(id, { $unset: { accessTokenHash: 1 }, accessTokenIssuedAt: null }, { timestamps: false })
    .select("name")
    .lean();
  if (!patient) throw ApiError.notFound("Patient not found");
  return patient;
}

/**
 * Public status check: the token must match and the name must be the
 * patient's own. Both failures give the same answer so neither can be probed.
 */
export async function findPatientStatus(name: string, token: string) {
  const patient = await Patient.findOne({ accessTokenHash: hashAccessToken(token) })
    .select("name condition doctorId createdAt updatedAt")
    .populate({ path: "doctorId", select: "name specialization hospital photoUrl" })
    .lean();
  if (!patient || normalizeName(patient.name) !== normalizeName(name)) {
    throw ApiError.notFound("No record matches that name and token. Check both and try again.");
  }
  const { doctorId: doctor, name: patientName, condition, createdAt, updatedAt } = patient;
  return { name: patientName, condition, doctor: doctor ?? null, registeredAt: createdAt, updatedAt };
}

import { Types, type QueryFilter } from "mongoose";
import { Doctor, type DoctorDocument } from "../models/Doctor.js";
import { Patient } from "../models/Patient.js";
import { ApiError } from "../utils/ApiError.js";
import { containsPattern, dateRangeFilter } from "../utils/query.js";
import { buildPagination } from "../utils/response.js";
import type { CreateDoctorInput, DoctorListQuery } from "../validators/doctor.validator.js";

const LIST_FIELDS = "name specialization hospital phone email qualifications photoUrl createdAt updatedAt";

/** Map of doctorId -> patient count, computed in one aggregation for the given doctors. */
async function countPatientsByDoctor(doctorIds: Types.ObjectId[]): Promise<Map<string, number>> {
  if (doctorIds.length === 0) return new Map();
  const rows = await Patient.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { doctorId: { $in: doctorIds } } },
    { $group: { _id: "$doctorId", count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [row._id.toString(), row.count]));
}

export async function listDoctors(query: DoctorListQuery) {
  const filter: QueryFilter<DoctorDocument> = {};
  if (query.search) {
    const pattern = containsPattern(query.search);
    filter.$or = [{ name: pattern }, { email: pattern }, { specialization: pattern }, { hospital: pattern }];
  }
  if (query.specialization) filter.specialization = query.specialization;
  if (query.hospital) filter.hospital = query.hospital;
  const createdAt = dateRangeFilter(query.startDate, query.endDate);
  if (createdAt) filter.createdAt = createdAt;

  const direction = query.sortOrder === "asc" ? 1 : -1;
  // `_id` tie-breaker keeps pagination stable when sort values are equal.
  const sort = { [query.sortBy]: direction, _id: direction } as const;

  const [doctors, total] = await Promise.all([
    Doctor.find(filter)
      .select(LIST_FIELDS)
      .sort(sort)
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    Doctor.countDocuments(filter),
  ]);

  const counts = await countPatientsByDoctor(doctors.map((d) => d._id));
  const data = doctors.map((d) => ({ ...d, patientCount: counts.get(d._id.toString()) ?? 0 }));

  return { data, pagination: buildPagination(query.page, query.limit, total) };
}

export async function getDoctorById(id: string) {
  const [doctor, patientCount] = await Promise.all([
    Doctor.findById(id).select(LIST_FIELDS).lean(),
    Patient.countDocuments({ doctorId: id }),
  ]);
  if (!doctor) throw ApiError.notFound("Doctor not found");
  return { ...doctor, patientCount };
}

export async function createDoctor(input: CreateDoctorInput) {
  const exists = await Doctor.exists({ email: input.email });
  if (exists) {
    throw ApiError.conflict("A doctor with this email already exists", [
      { field: "email", message: "Email is already in use" },
    ]);
  }
  const doctor = await Doctor.create(input);
  return { ...doctor.toObject(), patientCount: 0 };
}

export async function assertDoctorExists(id: string): Promise<void> {
  if (!(await Doctor.exists({ _id: id }))) throw ApiError.notFound("Doctor not found");
}

/** Distinct values for the doctor list filters (served from indexes). */
export async function getDoctorFilterOptions() {
  const [specializations, hospitals] = await Promise.all([
    Doctor.distinct("specialization"),
    Doctor.distinct("hospital"),
  ]);
  const sorted = (values: string[]) => values.sort((a, b) => a.localeCompare(b));
  return { specializations: sorted(specializations), hospitals: sorted(hospitals) };
}

/** Lightweight id/name list for doctor pickers, bounded and searchable. */
export async function listDoctorOptions(search: string | undefined, limit: number) {
  const filter: QueryFilter<DoctorDocument> = search ? { name: containsPattern(search) } : {};
  return Doctor.find(filter).select("name specialization").sort({ name: 1, _id: 1 }).limit(limit).lean();
}

import { Types, type QueryFilter } from "mongoose";
import { Doctor, type DoctorDocument } from "../models/Doctor.js";
import { ApiError } from "../utils/ApiError.js";
import { containsPattern } from "../utils/query.js";
import { buildPagination } from "../utils/response.js";
import { getSettings } from "./settings.service.js";

/** Fields any visitor may see. Contact details stay private. */
const PUBLIC_DOCTOR_FIELDS = "name specialization hospital qualifications photoUrl";

export async function getPublicSite() {
  const settings = await getSettings();
  const featuredIds = settings.homepage?.featuredDoctorIds ?? [];

  const [doctorCount, specializations, hospitals, featured] = await Promise.all([
    Doctor.estimatedDocumentCount(),
    Doctor.distinct("specialization"),
    Doctor.distinct("hospital"),
    settings.homepage?.showDoctors
      ? featuredIds.length > 0
        ? Doctor.find({ _id: { $in: featuredIds } }).select(PUBLIC_DOCTOR_FIELDS).lean()
        : Doctor.find().select(PUBLIC_DOCTOR_FIELDS).sort({ createdAt: -1, _id: -1 }).limit(4).lean()
      : Promise.resolve([]),
  ]);

  // Keep the admin's chosen order for featured doctors.
  const order = new Map(featuredIds.map((id, index) => [id.toString(), index]));
  const featuredDoctors = [...featured].sort(
    (a, b) => (order.get(a._id.toString()) ?? 0) - (order.get(b._id.toString()) ?? 0),
  );

  const { homepage, ...content } = settings;
  return {
    ...content,
    announcements: (settings.announcements ?? []).filter((a) => a.active),
    homepage: { showStats: homepage?.showStats ?? true, showDoctors: homepage?.showDoctors ?? true },
    stats: homepage?.showStats
      ? { doctors: doctorCount, specializations: specializations.length, hospitals: hospitals.length }
      : null,
    featuredDoctors,
    specializations: specializations.sort((a, b) => a.localeCompare(b)),
  };
}

export async function listPublicDoctors(query: { page: number; limit: number; search?: string; specialization?: string }) {
  const filter: QueryFilter<DoctorDocument> = {};
  if (query.search) {
    const pattern = containsPattern(query.search);
    filter.$or = [{ name: pattern }, { specialization: pattern }, { hospital: pattern }];
  }
  if (query.specialization) filter.specialization = query.specialization;

  const [data, total] = await Promise.all([
    Doctor.find(filter)
      .select(PUBLIC_DOCTOR_FIELDS)
      .sort({ name: 1, _id: 1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    Doctor.countDocuments(filter),
  ]);
  return { data, pagination: buildPagination(query.page, query.limit, total) };
}

export async function getPublicDoctor(id: string) {
  const doctor = await Doctor.findById(new Types.ObjectId(id)).select(PUBLIC_DOCTOR_FIELDS).lean();
  if (!doctor) throw ApiError.notFound("Doctor not found");
  return doctor;
}

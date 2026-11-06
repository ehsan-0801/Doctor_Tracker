import { Doctor } from "../models/Doctor.js";
import { Patient } from "../models/Patient.js";

const RECENT_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function getStats() {
  const now = Date.now();
  const recentSince = new Date(now - RECENT_DAYS * DAY_MS);
  const previousSince = new Date(now - 2 * RECENT_DAYS * DAY_MS);

  const [totalDoctors, totalPatients, unassignedPatients, recentPatients, previousPatients, recentDoctors] =
    await Promise.all([
      Doctor.countDocuments(),
      Patient.countDocuments(),
      Patient.countDocuments({ doctorId: null }),
      Patient.countDocuments({ createdAt: { $gte: recentSince } }),
      Patient.countDocuments({ createdAt: { $gte: previousSince, $lt: recentSince } }),
      Doctor.countDocuments({ createdAt: { $gte: recentSince } }),
    ]);

  const assignedPatients = totalPatients - unassignedPatients;
  return {
    totalDoctors,
    totalPatients,
    assignedPatients,
    unassignedPatients,
    // Based on assigned patients only, so unassigned records do not inflate the ratio.
    averagePatientsPerDoctor: totalDoctors === 0 ? 0 : Math.round((assignedPatients / totalDoctors) * 10) / 10,
    recentPeriodDays: RECENT_DAYS,
    recentPatients,
    previousPeriodPatients: previousPatients,
    recentDoctors,
  };
}

/** Doctors ranked by number of associated patients. */
export async function getPatientsPerDoctor(limit: number) {
  return Patient.aggregate<{ doctorId: string; name: string; specialization: string; patientCount: number }>([
    { $match: { doctorId: { $ne: null } } },
    { $group: { _id: "$doctorId", patientCount: { $sum: 1 } } },
    { $sort: { patientCount: -1, _id: 1 } },
    { $limit: limit },
    { $lookup: { from: Doctor.collection.name, localField: "_id", foreignField: "_id", as: "doctor" } },
    { $unwind: "$doctor" },
    {
      $project: {
        _id: 0,
        doctorId: { $toString: "$_id" },
        name: "$doctor.name",
        specialization: "$doctor.specialization",
        patientCount: 1,
      },
    },
  ]);
}

/** Patient registrations (by `createdAt`) per calendar month, including empty months. */
export async function getRegistrations(months: number) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));

  const rows = await Patient.aggregate<{ _id: string; count: number }>([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "UTC" } },
        count: { $sum: 1 },
      },
    },
  ]);
  const counts = new Map(rows.map((row) => [row._id, row.count]));

  return Array.from({ length: months }, (_, index) => {
    const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1));
    const month = date.toISOString().slice(0, 7);
    return { month, count: counts.get(month) ?? 0 };
  });
}

/** Patient count per condition, top N with the remainder grouped as "Other". */
export async function getConditionDistribution(limit: number) {
  const rows = await Patient.aggregate<{ condition: string; count: number }>([
    { $group: { _id: "$condition", count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $project: { _id: 0, condition: "$_id", count: 1 } },
  ]);
  if (rows.length <= limit) return rows;
  const top = rows.slice(0, limit);
  const otherCount = rows.slice(limit).reduce((sum, row) => sum + row.count, 0);
  return [...top, { condition: "Other conditions", count: otherCount }];
}

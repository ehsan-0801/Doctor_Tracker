import { Doctor } from "../src/models/Doctor.js";
import { Patient } from "../src/models/Patient.js";

let counter = 0;

export function doctorInput(overrides: Partial<Record<string, string>> = {}) {
  counter += 1;
  return {
    name: `Dr. Test ${counter}`,
    specialization: "Cardiology",
    hospital: "City Hospital",
    phone: "+1 555 010 2030",
    email: `doctor${counter}@example.com`,
    ...overrides,
  };
}

/** Insert a doctor directly, optionally with a custom creation date. */
export async function createDoctor(overrides: Partial<Record<string, string>> = {}, createdAt?: Date) {
  const data = doctorInput(overrides);
  if (!createdAt) return Doctor.create(data);
  const [doc] = await Doctor.insertMany([{ ...data, createdAt, updatedAt: createdAt }], { timestamps: false });
  return doc!;
}

export async function createPatient(
  data: { name?: string; condition?: string; doctorId: unknown },
  createdAt?: Date,
) {
  counter += 1;
  const doc = { name: data.name ?? `Patient ${counter}`, condition: data.condition ?? "Hypertension", doctorId: data.doctorId };
  if (!createdAt) return Patient.create(doc);
  const [created] = await Patient.insertMany([{ ...doc, createdAt, updatedAt: createdAt }], { timestamps: false });
  return created!;
}

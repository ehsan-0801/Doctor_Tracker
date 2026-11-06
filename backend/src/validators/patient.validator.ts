import { z } from "zod";
import { listQueryBase, objectIdSchema, optionalTrimmed, withDateRangeCheck } from "./common.js";

const nameSchema = z.string().trim().min(2, "Name must be at least 2 characters").max(120);
const conditionSchema = z.string().trim().min(2, "Condition is required").max(120);

/** Patient created from a doctor's page: the doctor comes from the URL. */
export const createDoctorPatientSchema = z.object({
  name: nameSchema,
  condition: conditionSchema,
});

/** Patient created from the global page: a doctor must be selected. */
export const createPatientSchema = createDoctorPatientSchema.extend({
  doctorId: objectIdSchema,
});

export const updatePatientSchema = z
  .object({
    name: nameSchema.optional(),
    condition: conditionSchema.optional(),
    doctorId: objectIdSchema.nullable().optional(),
  })
  .refine((body) => Object.values(body).some((v) => v !== undefined), "Provide at least one field to update");

export const patientListQuerySchema = withDateRangeCheck(
  listQueryBase.extend({
    condition: optionalTrimmed(120),
    // A doctor id, or "unassigned" for patients without a doctor.
    doctorId: z.union([objectIdSchema, z.literal("unassigned")]).optional(),
    sortBy: z.enum(["createdAt", "name"]).default("createdAt"),
  }),
);

export const doctorPatientParamsSchema = z.object({ id: objectIdSchema, patientId: objectIdSchema });

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type PatientListQuery = z.infer<typeof patientListQuerySchema>;

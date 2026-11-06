import { z } from "zod";
import { listQueryBase, optionalTrimmed, withDateRangeCheck } from "./common.js";

export const PHONE_PATTERN = /^\+?[0-9][0-9\s\-()]{6,19}$/;

export const createDoctorSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  specialization: z.string().trim().min(2, "Specialization is required").max(120),
  hospital: z.string().trim().min(2, "Hospital is required").max(160),
  phone: z.string().trim().regex(PHONE_PATTERN, "Enter a valid phone number"),
  email: z.email("Enter a valid email").trim().toLowerCase().max(254),
});

export const doctorListQuerySchema = withDateRangeCheck(
  listQueryBase.extend({
    specialization: optionalTrimmed(120),
    hospital: optionalTrimmed(160),
    sortBy: z.enum(["createdAt", "name"]).default("createdAt"),
  }),
);

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type DoctorListQuery = z.infer<typeof doctorListQuerySchema>;

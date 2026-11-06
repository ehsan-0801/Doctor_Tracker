import { z } from "zod";
import { optionalTrimmed } from "./common.js";

export const publicDoctorQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(500).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(12),
  search: optionalTrimmed(80),
  specialization: optionalTrimmed(120),
});

export const patientStatusSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(120),
  token: z.string().trim().min(8, "Enter the token from your hospital card").max(40),
});

import { z } from "zod";
import { optionalTrimmed } from "./common.js";

export const publicDoctorQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(500).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(12),
  search: optionalTrimmed(80),
  specialization: optionalTrimmed(120),
});

import { z } from "zod";

export const registrationsQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(36).default(12),
});

export const topLimitQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

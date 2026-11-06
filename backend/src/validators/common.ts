import { isValidObjectId } from "mongoose";
import { z } from "zod";

export const objectIdSchema = z
  .string()
  .refine((value) => isValidObjectId(value) && /^[a-f\d]{24}$/i.test(value), "Invalid id");

export const idParamsSchema = z.object({ id: objectIdSchema });

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .transform((value) => new Date(`${value}T00:00:00.000Z`))
  .refine((date) => !Number.isNaN(date.getTime()), "Invalid date");

/** Shared list parameters. Extend it, then wrap with `withDateRangeCheck`. */
export const listQueryBase = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(100).optional().transform((v) => v || undefined),
  startDate: dateOnly.optional(),
  endDate: dateOnly.optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export function withDateRangeCheck<T extends z.ZodType<{ startDate?: Date; endDate?: Date }>>(schema: T) {
  return schema.refine((q) => !q.startDate || !q.endDate || q.startDate <= q.endDate, {
    message: "startDate must be on or before endDate",
    path: ["startDate"],
  });
}

export const optionalTrimmed = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => v || undefined);

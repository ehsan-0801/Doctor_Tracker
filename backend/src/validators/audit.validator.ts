import { z } from "zod";
import { listQueryBase, objectIdSchema, optionalTrimmed, withDateRangeCheck } from "./common.js";

export const auditQuerySchema = withDateRangeCheck(
  listQueryBase.extend({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    action: optionalTrimmed(60),
    entityType: optionalTrimmed(30),
    actorId: objectIdSchema.optional(),
  }),
);

export const notificationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  before: z.string().datetime().optional(),
});

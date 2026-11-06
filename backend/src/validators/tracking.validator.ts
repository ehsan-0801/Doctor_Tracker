import { z } from "zod";
import { ATTACHMENT_KINDS, ATTACHMENT_MAX_BYTES } from "../constants/chat.js";
import { LOCATION_TYPES } from "../models/Location.js";
import { PRESENCE_STATUSES } from "../models/Presence.js";
import { objectIdSchema } from "./common.js";

const grid = (max: number, min = 0) => z.coerce.number().int().min(min).max(max);

export const locationSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(60),
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{1,12}$/, "Use up to 12 letters, digits or dashes"),
  type: z.enum(LOCATION_TYPES),
  floor: grid(50, -5),
  x: grid(200),
  y: grid(200),
  w: grid(100, 1),
  h: grid(100, 1),
  active: z.boolean().default(true),
});

export const updateLocationSchema = locationSchema.partial().refine((b) => Object.keys(b).length > 0, "Provide at least one field");

export const setPresenceSchema = z.object({
  locationId: objectIdSchema.nullable(),
  status: z.enum(PRESENCE_STATUSES),
  note: z.string().trim().max(120).default(""),
});

export const historyQuerySchema = z.object({ days: z.coerce.number().int().min(1).max(30).default(7) });

export const userIdParamsSchema = z.object({ userId: objectIdSchema });

export const openConversationSchema = z.object({ userId: objectIdSchema });
export const attachmentSchema = z.object({
  kind: z.enum(ATTACHMENT_KINDS),
  url: z.url().max(500),
  name: z.string().trim().min(1).max(200),
  size: z.number().int().positive().max(ATTACHMENT_MAX_BYTES, "Attachments must be 10 MB or smaller"),
  width: z.number().int().positive().max(20000).optional(),
  height: z.number().int().positive().max(20000).optional(),
});
export type AttachmentInput = z.infer<typeof attachmentSchema>;

export const sendMessageSchema = z
  .object({ body: z.string().trim().max(2000).default(""), attachment: attachmentSchema.optional() })
  .refine((m) => m.body.length > 0 || m.attachment, { message: "Message is empty", path: ["body"] });

export const attachmentSignatureSchema = z.object({ kind: z.enum(ATTACHMENT_KINDS) });
export const messagesQuerySchema = z.object({
  before: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

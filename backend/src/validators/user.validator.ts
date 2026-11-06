import { z } from "zod";
import { ROLES } from "../constants/roles.js";
import { listQueryBase, objectIdSchema, optionalTrimmed } from "./common.js";

const photoUrl = z.union([z.literal(""), z.url({ protocol: /^https$/, message: "Use an https:// image URL" }).max(500)]);

const email = z.string().trim().toLowerCase().max(254).pipe(z.email("Enter a valid email"));
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200)
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/\d/, "Password must contain a number");

export const createUserSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
    email,
    role: z.enum(ROLES),
    password,
    doctorId: objectIdSchema.optional(),
    photoUrl: photoUrl.optional(),
  })
  .refine((u) => u.role !== "doctor" || u.doctorId, { message: "Select the doctor this account belongs to", path: ["doctorId"] });

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    role: z.enum(ROLES).optional(),
    doctorId: objectIdSchema.nullable().optional(),
    active: z.boolean().optional(),
    photoUrl: photoUrl.optional(),
  })
  .refine((body) => Object.values(body).some((v) => v !== undefined), "Provide at least one field to update");

export const resetPasswordSchema = z.object({ password });

export const userListQuerySchema = listQueryBase.extend({
  role: z.enum(ROLES).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  search: optionalTrimmed(100),
  sortBy: z.enum(["createdAt", "name"]).default("createdAt"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;

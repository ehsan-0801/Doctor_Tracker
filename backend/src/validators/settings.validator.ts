import { z } from "zod";
import { SERVICE_ICONS } from "../models/SiteSettings.js";
import { objectIdSchema } from "./common.js";

const text = (max: number, min = 0) => z.string().trim().min(min).max(max);

export const updateSettingsSchema = z.object({
  hospitalName: text(120, 2),
  tagline: text(160),
  heroTitle: text(120, 3),
  heroSubtitle: text(300),
  about: text(1500),
  services: z
    .array(z.object({ title: text(60, 2), description: text(240, 2), icon: z.enum(SERVICE_ICONS) }))
    .max(12, "Up to 12 services"),
  announcements: z
    .array(z.object({ title: text(100, 2), body: text(400), active: z.boolean() }))
    .max(10, "Up to 10 announcements"),
  contact: z.object({
    phone: text(40),
    emergencyPhone: text(40),
    email: z.union([z.literal(""), z.string().trim().toLowerCase().max(254).pipe(z.email("Enter a valid email"))]),
    address: text(200),
    hours: text(120),
  }),
  homepage: z.object({
    showStats: z.boolean(),
    showDoctors: z.boolean(),
    featuredDoctorIds: z.array(objectIdSchema).max(8, "Feature up to 8 doctors"),
  }),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

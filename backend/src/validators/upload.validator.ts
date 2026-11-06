import { z } from "zod";

/** Upload destinations; each maps to a fixed Cloudinary folder. */
export const UPLOAD_FOLDERS = { doctors: "doctrack/doctors", site: "doctrack/site" } as const;

export const uploadSignatureSchema = z.object({ purpose: z.enum(["doctors", "site"]) });

import { z } from "zod";
import { parseCloudinaryUrl } from "./cloudinary.js";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:3000"),
  // Optional: enables image uploads. Format: cloudinary://<api_key>:<api_secret>@<cloud_name>
  CLOUDINARY_URL: z.string().optional(),
  // Signs short-lived real-time (WebSocket) tokens. Set a long random value in production.
  REALTIME_SECRET: z.string().min(32).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === "production",
  cloudinary: parseCloudinaryUrl(parsed.data.CLOUDINARY_URL),
};

if (parsed.data.CLOUDINARY_URL && !env.cloudinary) {
  console.warn("CLOUDINARY_URL is set but not in the form cloudinary://<api_key>:<api_secret>@<cloud_name>; uploads are disabled.");
}

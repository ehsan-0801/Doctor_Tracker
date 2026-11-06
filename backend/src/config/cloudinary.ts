import { createHash } from "node:crypto";

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

/** Parses CLOUDINARY_URL (cloudinary://<api_key>:<api_secret>@<cloud_name>); null when unset or invalid. */
export function parseCloudinaryUrl(value: string | undefined): CloudinaryConfig | null {
  if (!value) return null;
  const match = /^cloudinary:\/\/([^:]+):([^@]+)@([\w-]+)$/.exec(value.trim());
  if (!match) return null;
  const [, apiKey, apiSecret, cloudName] = match;
  return { apiKey: apiKey!, apiSecret: apiSecret!, cloudName: cloudName! };
}

/**
 * Cloudinary API signature: SHA-1 of the alphabetically sorted "key=value"
 * pairs joined with "&", followed by the API secret.
 */
export function signParams(params: Record<string, string | number>, apiSecret: string): string {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(payload + apiSecret).digest("hex");
}

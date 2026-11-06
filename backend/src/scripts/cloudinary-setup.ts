/**
 * Verifies CLOUDINARY_URL and creates the DocTrack upload folders.
 *   npm run cloudinary:setup
 */
import { parseCloudinaryUrl } from "../config/cloudinary.js";
import { UPLOAD_FOLDERS } from "../validators/upload.validator.js";

const config = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
if (!config) {
  console.error("CLOUDINARY_URL is missing or not in the form cloudinary://<api_key>:<api_secret>@<cloud_name>");
  process.exit(1);
}

const base = `https://api.cloudinary.com/v1_1/${config.cloudName}`;
const auth = `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64")}`;

const ping = await fetch(`${base}/ping`, { headers: { Authorization: auth } });
const pingBody = (await ping.json()) as { status?: string; error?: { message: string } };
if (!ping.ok) {
  console.error(`Cloudinary rejected the credentials: ${pingBody.error?.message ?? ping.status}`);
  console.error("Copy the API key and secret again from Cloudinary → Settings → API Keys.");
  process.exit(1);
}
console.log(`Credentials OK for cloud "${config.cloudName}".`);

for (const folder of ["DocTrack", ...Object.values(UPLOAD_FOLDERS)]) {
  const res = await fetch(`${base}/folders/${folder}`, { method: "POST", headers: { Authorization: auth } });
  console.log(`${folder}: ${res.ok ? "ready" : `failed (${res.status})`}`);
}

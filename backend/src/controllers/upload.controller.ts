import type { Request, Response } from "express";
import { signParams } from "../config/cloudinary.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/response.js";
import { UPLOAD_FOLDERS, uploadSignatureSchema } from "../validators/upload.validator.js";

const ALLOWED_FORMATS = "jpg,jpeg,png,webp";

/**
 * Signs a direct browser → Cloudinary upload. The secret never leaves the
 * server; the signature pins the folder and allowed formats, and Cloudinary
 * rejects it after one hour.
 */
export function signature(req: Request, res: Response) {
  const cloudinary = env.cloudinary;
  if (!cloudinary) throw new ApiError(503, "Image uploads are not configured on the server");

  const { purpose } = uploadSignatureSchema.parse(req.body);
  const params = { allowed_formats: ALLOWED_FORMATS, folder: UPLOAD_FOLDERS[purpose], timestamp: Math.floor(Date.now() / 1000) };

  sendSuccess(res, "Upload signature created", {
    ...params,
    signature: signParams(params, cloudinary.apiSecret),
    apiKey: cloudinary.apiKey,
    cloudName: cloudinary.cloudName,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/image/upload`,
  });
}

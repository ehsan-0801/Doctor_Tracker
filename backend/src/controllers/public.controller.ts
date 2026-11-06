import type { Request, Response } from "express";
import * as publicService from "../services/public.service.js";
import { sendSuccess } from "../utils/response.js";
import { idParamsSchema } from "../validators/common.js";
import { publicDoctorQuerySchema } from "../validators/public.validator.js";

// Public content may be cached briefly by browsers and CDNs.
const cachePublic = (res: Response) => res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");

export async function site(_req: Request, res: Response) {
  cachePublic(res);
  sendSuccess(res, "Site content retrieved successfully", await publicService.getPublicSite());
}

export async function doctors(req: Request, res: Response) {
  cachePublic(res);
  const { data, pagination } = await publicService.listPublicDoctors(publicDoctorQuerySchema.parse(req.query));
  sendSuccess(res, "Doctors retrieved successfully", data, { pagination });
}

export async function doctor(req: Request, res: Response) {
  cachePublic(res);
  const { id } = idParamsSchema.parse(req.params);
  sendSuccess(res, "Doctor retrieved successfully", await publicService.getPublicDoctor(id));
}

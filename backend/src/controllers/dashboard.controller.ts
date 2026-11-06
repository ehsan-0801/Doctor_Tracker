import type { Request, Response } from "express";
import * as dashboardService from "../services/dashboard.service.js";
import { sendSuccess } from "../utils/response.js";
import { registrationsQuerySchema, topLimitQuerySchema } from "../validators/dashboard.validator.js";

export async function stats(_req: Request, res: Response) {
  sendSuccess(res, "Dashboard statistics retrieved successfully", await dashboardService.getStats());
}

export async function patientsPerDoctor(req: Request, res: Response) {
  const { limit } = topLimitQuerySchema.parse(req.query);
  sendSuccess(res, "Patient distribution retrieved successfully", await dashboardService.getPatientsPerDoctor(limit));
}

export async function registrations(req: Request, res: Response) {
  const { months } = registrationsQuerySchema.parse(req.query);
  sendSuccess(res, "Registration statistics retrieved successfully", await dashboardService.getRegistrations(months));
}

export async function conditions(req: Request, res: Response) {
  const { limit } = topLimitQuerySchema.parse(req.query);
  sendSuccess(res, "Condition statistics retrieved successfully", await dashboardService.getConditionDistribution(limit));
}

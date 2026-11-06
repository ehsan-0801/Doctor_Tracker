import type { Request, Response } from "express";
import * as settingsService from "../services/settings.service.js";
import { sendSuccess } from "../utils/response.js";
import { updateSettingsSchema } from "../validators/settings.validator.js";

export async function get(_req: Request, res: Response) {
  sendSuccess(res, "Settings retrieved successfully", await settingsService.getSettingsForAdmin());
}

export async function update(req: Request, res: Response) {
  const settings = await settingsService.updateSettings(updateSettingsSchema.parse(req.body));
  sendSuccess(res, "Settings saved", settings);
}

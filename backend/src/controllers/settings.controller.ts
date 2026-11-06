import type { Request, Response } from "express";
import * as settingsService from "../services/settings.service.js";
import { currentUser } from "../middleware/requireAuth.js";
import { recordAudit } from "../services/audit.service.js";
import { sendSuccess } from "../utils/response.js";
import { updateSettingsSchema } from "../validators/settings.validator.js";

export async function get(_req: Request, res: Response) {
  sendSuccess(res, "Settings retrieved successfully", await settingsService.getSettingsForAdmin());
}

export async function update(req: Request, res: Response) {
  const input = updateSettingsSchema.parse(req.body);
  const settings = await settingsService.updateSettings(input);
  await recordAudit(req, currentUser(res), { action: "settings.update", entityType: "settings", entityLabel: input.hospitalName, changes: { sections: Object.keys(input) } });
  sendSuccess(res, "Settings saved", settings);
}

import { Router } from "express";
import * as settings from "../controllers/settings.controller.js";
import { requirePermission } from "../middleware/requireAuth.js";

export const settingsRouter = Router();
settingsRouter.use(requirePermission("settings:manage"));
settingsRouter.get("/", settings.get);
settingsRouter.put("/", settings.update);

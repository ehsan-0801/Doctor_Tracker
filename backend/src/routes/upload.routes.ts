import { Router } from "express";
import * as uploads from "../controllers/upload.controller.js";
import { requirePermission } from "../middleware/requireAuth.js";

export const uploadRouter = Router();
uploadRouter.post("/signature", requirePermission("media:upload"), uploads.signature);

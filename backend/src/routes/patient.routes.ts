import { Router } from "express";
import * as patients from "../controllers/patient.controller.js";
import { requirePermission } from "../middleware/requireAuth.js";

const read = requirePermission("patients:read");

export const patientRouter = Router();
patientRouter.get("/", read, patients.list);
patientRouter.post("/", requirePermission("patients:write"), patients.create);
patientRouter.get("/conditions", patients.conditions);
patientRouter.get("/:id", read, patients.getById);
patientRouter.patch("/:id", requirePermission("patients:write"), patients.update);
patientRouter.delete("/:id", requirePermission("patients:delete"), patients.remove);
patientRouter.post("/:id/access-token", requirePermission("patients:write"), patients.issueAccessToken);
patientRouter.delete("/:id/access-token", requirePermission("patients:write"), patients.revokeAccessToken);

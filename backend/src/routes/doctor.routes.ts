import { Router } from "express";
import * as doctors from "../controllers/doctor.controller.js";
import { requirePermission } from "../middleware/requireAuth.js";

const read = requirePermission("doctors:read");

export const doctorRouter = Router();
doctorRouter.get("/", read, doctors.list);
doctorRouter.post("/", requirePermission("doctors:create"), doctors.create);
doctorRouter.get("/filters", read, doctors.filterOptions);
doctorRouter.get("/options", read, doctors.options);
doctorRouter.get("/:id", read, doctors.getById);
doctorRouter.patch("/:id", requirePermission("doctors:update"), doctors.update);
doctorRouter.get("/:id/patients", requirePermission("patients:read"), doctors.listPatients);
doctorRouter.post("/:id/patients", requirePermission("patients:write"), doctors.addPatient);
doctorRouter.delete("/:id/patients/:patientId", requirePermission("patients:assign"), doctors.removePatient);

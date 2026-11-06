import { Router } from "express";
import * as doctors from "../controllers/doctor.controller.js";

export const doctorRouter = Router();
doctorRouter.get("/", doctors.list);
doctorRouter.post("/", doctors.create);
doctorRouter.get("/filters", doctors.filterOptions);
doctorRouter.get("/options", doctors.options);
doctorRouter.get("/:id", doctors.getById);
doctorRouter.get("/:id/patients", doctors.listPatients);
doctorRouter.post("/:id/patients", doctors.addPatient);
doctorRouter.delete("/:id/patients/:patientId", doctors.removePatient);

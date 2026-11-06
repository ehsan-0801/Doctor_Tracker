import { Router } from "express";
import * as patients from "../controllers/patient.controller.js";

export const patientRouter = Router();
patientRouter.get("/", patients.list);
patientRouter.post("/", patients.create);
patientRouter.get("/conditions", patients.conditions);
patientRouter.get("/:id", patients.getById);
patientRouter.patch("/:id", patients.update);
patientRouter.delete("/:id", patients.remove);

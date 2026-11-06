import { Router } from "express";
import * as dashboard from "../controllers/dashboard.controller.js";

export const dashboardRouter = Router();
dashboardRouter.get("/stats", dashboard.stats);
dashboardRouter.get("/patients-per-doctor", dashboard.patientsPerDoctor);
dashboardRouter.get("/registrations", dashboard.registrations);
dashboardRouter.get("/conditions", dashboard.conditions);

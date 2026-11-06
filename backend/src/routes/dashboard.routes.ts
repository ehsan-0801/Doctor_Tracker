import { Router } from "express";
import * as dashboard from "../controllers/dashboard.controller.js";
import { requirePermission } from "../middleware/requireAuth.js";

export const dashboardRouter = Router();
dashboardRouter.use(requirePermission("dashboard:read"));
dashboardRouter.get("/stats", dashboard.stats);
dashboardRouter.get("/patients-per-doctor", dashboard.patientsPerDoctor);
dashboardRouter.get("/registrations", dashboard.registrations);
dashboardRouter.get("/conditions", dashboard.conditions);

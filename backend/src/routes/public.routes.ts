import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import * as publicController from "../controllers/public.controller.js";

/** Unauthenticated, read-only website content. */
export const publicRouter = Router();
publicRouter.use(
  rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: "draft-8", legacyHeaders: false }),
);
publicRouter.get("/site", publicController.site);
publicRouter.get("/doctors", publicController.doctors);
publicRouter.get("/doctors/:id", publicController.doctor);

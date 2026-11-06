import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import * as publicController from "../controllers/public.controller.js";

/** Unauthenticated, read-only website content. */
export const publicRouter = Router();
publicRouter.use(
  rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: "draft-8", legacyHeaders: false }),
);
// Failed status checks are capped per IP so tokens cannot be guessed.
const statusLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: "Too many attempts. Try again in 15 minutes.", errors: [] },
});

publicRouter.get("/site", publicController.site);
publicRouter.get("/doctors", publicController.doctors);
publicRouter.get("/doctors/:id", publicController.doctor);
publicRouter.post("/patient-status", statusLimiter, publicController.patientStatus);

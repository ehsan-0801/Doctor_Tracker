import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import * as auth from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: "Too many sign-in attempts. Try again in 15 minutes.", errors: [] },
});

export const authRouter = Router();
authRouter.post("/login", loginLimiter, auth.login);
authRouter.post("/logout", auth.logout);
authRouter.get("/session", requireAuth, auth.session);

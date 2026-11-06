import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { authRouter } from "./auth.routes.js";
import { dashboardRouter } from "./dashboard.routes.js";
import { doctorRouter } from "./doctor.routes.js";
import { patientRouter } from "./patient.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ success: true, message: "OK", data: null });
});
apiRouter.use("/auth", authRouter);

// Everything below requires an authenticated administrator.
apiRouter.use(requireAuth);
apiRouter.use("/doctors", doctorRouter);
apiRouter.use("/patients", patientRouter);
apiRouter.use("/dashboard", dashboardRouter);

import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { authRouter } from "./auth.routes.js";
import { dashboardRouter } from "./dashboard.routes.js";
import { doctorRouter } from "./doctor.routes.js";
import { patientRouter } from "./patient.routes.js";
import { publicRouter } from "./public.routes.js";
import { settingsRouter } from "./settings.routes.js";
import { chatRouter, locationRouter, presenceRouter, realtimeRouter } from "./tracking.routes.js";
import { uploadRouter } from "./upload.routes.js";
import { userRouter } from "./user.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ success: true, message: "OK", data: null });
});
apiRouter.use("/auth", authRouter);
apiRouter.use("/public", publicRouter);

// Everything below requires a signed-in user; each router checks role permissions.
apiRouter.use(requireAuth);
apiRouter.use("/doctors", doctorRouter);
apiRouter.use("/patients", patientRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/settings", settingsRouter);
apiRouter.use("/uploads", uploadRouter);
apiRouter.use("/realtime", realtimeRouter);
apiRouter.use("/locations", locationRouter);
apiRouter.use("/presence", presenceRouter);
apiRouter.use("/chat", chatRouter);

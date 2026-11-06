import { Router } from "express";
import * as audit from "../controllers/audit.controller.js";
import { requirePermission } from "../middleware/requireAuth.js";

export const auditRouter = Router();
auditRouter.use(requirePermission("audit:read"));
auditRouter.get("/", audit.listAudit);
auditRouter.get("/facets", audit.auditFacets);

/** Every signed-in user's own notifications. */
export const notificationRouter = Router();
notificationRouter.get("/", audit.listNotifications);
notificationRouter.post("/read-all", audit.readAllNotifications);
notificationRouter.post("/:id/read", audit.readNotification);

import type { Request, Response } from "express";
import { currentUser } from "../middleware/requireAuth.js";
import * as auditService from "../services/audit.service.js";
import * as notificationService from "../services/notification.service.js";
import { sendSuccess } from "../utils/response.js";
import { idParamsSchema } from "../validators/common.js";
import { auditQuerySchema, notificationsQuerySchema } from "../validators/audit.validator.js";

export async function listAudit(req: Request, res: Response) {
  const { data, pagination } = await auditService.listAudit(auditQuerySchema.parse(req.query));
  sendSuccess(res, "Audit log retrieved", data, { pagination });
}

export async function auditFacets(_req: Request, res: Response) {
  sendSuccess(res, "Audit filters retrieved", await auditService.auditFacets());
}

export async function listNotifications(req: Request, res: Response) {
  const { limit, before } = notificationsQuerySchema.parse(req.query);
  sendSuccess(res, "Notifications retrieved", await notificationService.listNotifications(currentUser(res).id, limit, before ? new Date(before) : undefined));
}

export async function readNotification(req: Request, res: Response) {
  const { id } = idParamsSchema.parse(req.params);
  await notificationService.markNotificationRead(currentUser(res).id, id);
  sendSuccess(res, "Notification marked as read", null);
}

export async function readAllNotifications(_req: Request, res: Response) {
  await notificationService.markAllNotificationsRead(currentUser(res).id);
  sendSuccess(res, "All notifications marked as read", null);
}

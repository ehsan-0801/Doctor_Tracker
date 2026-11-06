import type { Request, Response } from "express";
import { currentUser } from "../middleware/requireAuth.js";
import { createRealtimeToken } from "../realtime/server.js";
import * as chatService from "../services/chat.service.js";
import * as locationService from "../services/location.service.js";
import * as presenceService from "../services/presence.service.js";
import { recordAudit } from "../services/audit.service.js";
import { sendSuccess } from "../utils/response.js";
import { idParamsSchema } from "../validators/common.js";
import {
  historyQuerySchema,
  locationSchema,
  messagesQuerySchema,
  openConversationSchema,
  sendMessageSchema,
  setPresenceSchema,
  updateLocationSchema,
  userIdParamsSchema,
} from "../validators/tracking.validator.js";

// Real-time
export function realtimeToken(_req: Request, res: Response) {
  sendSuccess(res, "Real-time token issued", createRealtimeToken(currentUser(res).id));
}

// Locations
export async function listLocations(_req: Request, res: Response) {
  sendSuccess(res, "Locations retrieved successfully", await locationService.listLocations());
}
export async function createLocation(req: Request, res: Response) {
  const input = locationSchema.parse(req.body);
  const location = await locationService.createLocation(input);
  await recordAudit(req, currentUser(res), { action: "location.create", entityType: "location", entityId: String(location?._id), entityLabel: input.name, changes: input });
  sendSuccess(res, "Location created", location, { status: 201 });
}
export async function updateLocation(req: Request, res: Response) {
  const { id } = idParamsSchema.parse(req.params);
  const input = updateLocationSchema.parse(req.body);
  const location = await locationService.updateLocation(id, input);
  await recordAudit(req, currentUser(res), { action: "location.update", entityType: "location", entityId: id, entityLabel: location.name, changes: input });
  sendSuccess(res, "Location updated", location);
}
export async function deleteLocation(req: Request, res: Response) {
  const { id } = idParamsSchema.parse(req.params);
  await locationService.deleteLocation(id);
  await recordAudit(req, currentUser(res), { action: "location.delete", entityType: "location", entityId: id });
  sendSuccess(res, "Location deleted", null);
}

// Presence
export async function listPresence(_req: Request, res: Response) {
  sendSuccess(res, "Live locations retrieved", await presenceService.listPresence(currentUser(res)));
}
export async function setPresence(req: Request, res: Response) {
  const { userId } = userIdParamsSchema.parse(req.params);
  const actor = currentUser(res);
  const input = setPresenceSchema.parse(req.body);
  const view = await presenceService.setPresence(actor, userId, input);
  // Self check-ins are routine (kept in the movement history); log changes made for someone else.
  if (userId !== actor.id) {
    await recordAudit(req, actor, { action: "presence.update", entityType: "user", entityId: userId, entityLabel: view.name, changes: { status: input.status, location: view.location?.code ?? null, note: input.note } });
  }
  sendSuccess(res, "Location updated", view);
}
export async function presenceHistory(req: Request, res: Response) {
  const { userId } = userIdParamsSchema.parse(req.params);
  const { days } = historyQuerySchema.parse(req.query);
  sendSuccess(res, "Location history retrieved", await presenceService.presenceHistory(userId, days));
}

// Chat
export async function contacts(_req: Request, res: Response) {
  sendSuccess(res, "Contacts retrieved", await chatService.listContacts(currentUser(res)));
}
export async function conversations(_req: Request, res: Response) {
  sendSuccess(res, "Conversations retrieved", await chatService.listConversations(currentUser(res)));
}
export async function openConversation(req: Request, res: Response) {
  const { userId } = openConversationSchema.parse(req.body);
  sendSuccess(res, "Conversation ready", await chatService.openConversation(currentUser(res), userId));
}
export async function messages(req: Request, res: Response) {
  const { id } = idParamsSchema.parse(req.params);
  const { before, limit } = messagesQuerySchema.parse(req.query);
  sendSuccess(res, "Messages retrieved", await chatService.listMessages(currentUser(res), id, before, limit));
}
export async function sendMessage(req: Request, res: Response) {
  const { id } = idParamsSchema.parse(req.params);
  const { body } = sendMessageSchema.parse(req.body);
  sendSuccess(res, "Message sent", await chatService.sendMessage(currentUser(res), id, body), { status: 201 });
}
export async function markRead(req: Request, res: Response) {
  const { id } = idParamsSchema.parse(req.params);
  await chatService.markRead(currentUser(res), id);
  sendSuccess(res, "Marked as read", null);
}

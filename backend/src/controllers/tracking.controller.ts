import type { Request, Response } from "express";
import { currentUser } from "../middleware/requireAuth.js";
import { createRealtimeToken } from "../realtime/server.js";
import * as chatService from "../services/chat.service.js";
import * as locationService from "../services/location.service.js";
import * as presenceService from "../services/presence.service.js";
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
  sendSuccess(res, "Location created", await locationService.createLocation(locationSchema.parse(req.body)), { status: 201 });
}
export async function updateLocation(req: Request, res: Response) {
  const { id } = idParamsSchema.parse(req.params);
  sendSuccess(res, "Location updated", await locationService.updateLocation(id, updateLocationSchema.parse(req.body)));
}
export async function deleteLocation(req: Request, res: Response) {
  const { id } = idParamsSchema.parse(req.params);
  await locationService.deleteLocation(id);
  sendSuccess(res, "Location deleted", null);
}

// Presence
export async function listPresence(_req: Request, res: Response) {
  sendSuccess(res, "Live locations retrieved", await presenceService.listPresence(currentUser(res)));
}
export async function setPresence(req: Request, res: Response) {
  const { userId } = userIdParamsSchema.parse(req.params);
  sendSuccess(res, "Location updated", await presenceService.setPresence(currentUser(res), userId, setPresenceSchema.parse(req.body)));
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

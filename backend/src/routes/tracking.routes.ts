import { Router } from "express";
import * as tracking from "../controllers/tracking.controller.js";
import { requirePermission } from "../middleware/requireAuth.js";

export const realtimeRouter = Router();
realtimeRouter.get("/token", tracking.realtimeToken);

export const locationRouter = Router();
locationRouter.get("/", tracking.listLocations);
locationRouter.post("/", requirePermission("locations:manage"), tracking.createLocation);
locationRouter.patch("/:id", requirePermission("locations:manage"), tracking.updateLocation);
locationRouter.delete("/:id", requirePermission("locations:manage"), tracking.deleteLocation);

export const presenceRouter = Router();
presenceRouter.get("/", tracking.listPresence);
presenceRouter.put("/:userId", tracking.setPresence); // access checked in the service (self / admin / assigned staff)
presenceRouter.get("/:userId/history", requirePermission("tracking:all"), tracking.presenceHistory);

export const chatRouter = Router();
chatRouter.get("/contacts", tracking.contacts);
chatRouter.get("/conversations", tracking.conversations);
chatRouter.post("/conversations", tracking.openConversation);
chatRouter.get("/conversations/:id/messages", tracking.messages);
chatRouter.post("/conversations/:id/messages", tracking.sendMessage);
chatRouter.post("/conversations/:id/read", tracking.markRead);

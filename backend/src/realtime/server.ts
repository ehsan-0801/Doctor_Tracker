import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

/**
 * Real-time layer (Socket.IO over WebSocket). Browsers authenticate with a
 * short-lived HMAC token obtained from GET /api/realtime/token (cookie-authenticated),
 * because the WebSocket connects straight to the API origin, not through the
 * frontend's /api rewrite.
 *
 * Rooms: `user:<id>` (chat), `presence:all` (admin: everyone's location),
 * `presence:doctors` (all portal users: doctors' locations).
 */
let io: Server | null = null;
const secret = env.REALTIME_SECRET ?? randomBytes(32).toString("hex");
const TOKEN_TTL_MS = 2 * 60 * 1000;
const online = new Map<string, number>();

if (!env.REALTIME_SECRET && env.isProduction) {
  console.warn("REALTIME_SECRET is not set; using a per-process secret (fine for a single instance).");
}

const sign = (payload: string) => createHmac("sha256", secret).update(payload).digest("base64url");

export function createRealtimeToken(userId: string): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = `${userId}.${expiresAt}`;
  return { token: `${payload}.${sign(payload)}`, expiresAt };
}

export function verifyRealtimeToken(token: unknown): string | null {
  if (typeof token !== "string") return null;
  const [userId, exp, signature] = token.split(".");
  if (!userId || !exp || !signature || Number(exp) < Date.now()) return null;
  const expected = Buffer.from(sign(`${userId}.${exp}`));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given) ? userId : null;
}

export const isOnline = (userId: string) => (online.get(userId) ?? 0) > 0;

export function initRealtime(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.CLIENT_ORIGIN, credentials: true },
    path: "/socket.io",
  });

  io.use(async (socket, next) => {
    const userId = verifyRealtimeToken(socket.handshake.auth?.token);
    if (!userId) return next(new Error("unauthorized"));
    const user = await User.findOne({ _id: userId, active: true }).select("role").lean();
    if (!user) return next(new Error("unauthorized"));
    socket.data.userId = userId;
    socket.data.role = user.role;
    next();
  });

  io.on("connection", (socket) => {
    const userId: string = socket.data.userId;
    void socket.join([`user:${userId}`, "presence:doctors", ...(socket.data.role === "admin" ? ["presence:all"] : [])]);

    const count = (online.get(userId) ?? 0) + 1;
    online.set(userId, count);
    if (count === 1) io?.emit("user:online", { userId, online: true });

    socket.on("disconnect", () => {
      const left = (online.get(userId) ?? 1) - 1;
      if (left <= 0) {
        online.delete(userId);
        io?.emit("user:online", { userId, online: false });
      } else online.set(userId, left);
    });
  });

  return io;
}

/** Location change: everyone sees doctors; only admins see other roles. */
export function emitPresence(update: { role: string } & Record<string, unknown>) {
  if (!io) return;
  io.to(update.role === "doctor" ? ["presence:all", "presence:doctors"] : ["presence:all"]).emit("presence:update", update);
}

export function emitToUsers(userIds: string[], event: string, payload: unknown) {
  if (!io || userIds.length === 0) return;
  io.to(userIds.map((id) => `user:${id}`)).emit(event, payload);
}

import type { CookieOptions, Request, Response } from "express";
import { env } from "../config/env.js";
import { SESSION_COOKIE_NAME } from "../constants/auth.js";
import * as authService from "../services/auth.service.js";
import { currentUser } from "../middleware/requireAuth.js";
import { recordAudit } from "../services/audit.service.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/response.js";
import { loginSchema } from "../validators/auth.validator.js";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: "lax",
  path: "/",
};

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);
  let result: Awaited<ReturnType<typeof authService.login>>;
  try {
    result = await authService.login(email, password);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      await recordAudit(req, null, { action: "auth.login_failed", entityType: "auth", entityLabel: email });
    }
    throw error;
  }
  const { token, expiresAt, user } = result;
  await recordAudit(req, user, { action: "auth.login", entityType: "user", entityId: user.id, entityLabel: user.email });
  res.cookie(SESSION_COOKIE_NAME, token, { ...cookieOptions, expires: expiresAt });
  sendSuccess(res, "Signed in successfully", { user });
}

export async function logout(req: Request, res: Response) {
  const token: unknown = req.cookies?.[SESSION_COOKIE_NAME];
  if (typeof token === "string" && token) {
    const user = await authService.getSessionUser(token);
    await authService.logout(token);
    if (user) await recordAudit(req, user, { action: "auth.logout", entityType: "user", entityId: user.id, entityLabel: user.email });
  }
  res.clearCookie(SESSION_COOKIE_NAME, cookieOptions);
  sendSuccess(res, "Signed out successfully", null);
}

export function session(_req: Request, res: Response) {
  sendSuccess(res, "Session is active", { user: currentUser(res) });
}

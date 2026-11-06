import type { CookieOptions, Request, Response } from "express";
import { env } from "../config/env.js";
import { SESSION_COOKIE_NAME } from "../constants/auth.js";
import * as authService from "../services/auth.service.js";
import { currentUser } from "../middleware/requireAuth.js";
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
  const { token, expiresAt, user } = await authService.login(email, password);
  res.cookie(SESSION_COOKIE_NAME, token, { ...cookieOptions, expires: expiresAt });
  sendSuccess(res, "Signed in successfully", { user });
}

export async function logout(req: Request, res: Response) {
  const token: unknown = req.cookies?.[SESSION_COOKIE_NAME];
  if (typeof token === "string" && token) await authService.logout(token);
  res.clearCookie(SESSION_COOKIE_NAME, cookieOptions);
  sendSuccess(res, "Signed out successfully", null);
}

export function session(_req: Request, res: Response) {
  sendSuccess(res, "Session is active", { user: currentUser(res) });
}

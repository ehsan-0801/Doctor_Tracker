import type { NextFunction, Request, Response } from "express";
import { SESSION_COOKIE_NAME } from "../constants/auth.js";
import { getSessionAdmin } from "../services/auth.service.js";
import { ApiError } from "../utils/ApiError.js";

/** Rejects the request unless it carries a valid, unexpired session cookie. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token: unknown = req.cookies?.[SESSION_COOKIE_NAME];
  if (typeof token !== "string" || token.length === 0) throw ApiError.unauthorized();

  const admin = await getSessionAdmin(token);
  if (!admin) throw ApiError.unauthorized("Your session has expired. Please sign in again.");

  res.locals.admin = admin;
  next();
}

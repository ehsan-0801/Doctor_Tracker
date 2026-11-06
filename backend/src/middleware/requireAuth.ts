import type { NextFunction, Request, Response } from "express";
import { SESSION_COOKIE_NAME } from "../constants/auth.js";
import { can, type Permission } from "../constants/roles.js";
import { getSessionUser, type AuthenticatedUser } from "../services/auth.service.js";
import { ApiError } from "../utils/ApiError.js";

/** Rejects the request unless it carries a valid, unexpired session for an active user. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token: unknown = req.cookies?.[SESSION_COOKIE_NAME];
  if (typeof token !== "string" || token.length === 0) throw ApiError.unauthorized();

  const user = await getSessionUser(token);
  if (!user) throw ApiError.unauthorized("Your session has expired. Please sign in again.");

  res.locals.user = user;
  next();
}

/** Route guard: the signed-in user's role must grant the capability. Use after `requireAuth`. */
export function requirePermission(permission: Permission) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const user = res.locals.user;
    if (!user) throw ApiError.unauthorized();
    if (!can(user.role, permission)) throw ApiError.forbidden();
    next();
  };
}

/** The authenticated user; only call in handlers behind `requireAuth`. */
export function currentUser(res: Response): AuthenticatedUser {
  const user = res.locals.user;
  if (!user) throw ApiError.unauthorized();
  return user;
}

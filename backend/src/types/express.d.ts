import type { AuthenticatedUser } from "../services/auth.service.js";

declare global {
  namespace Express {
    interface Locals {
      user?: AuthenticatedUser;
    }
  }
}

export {};

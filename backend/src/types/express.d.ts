import type { AuthenticatedAdmin } from "../services/auth.service.js";

declare global {
  namespace Express {
    interface Locals {
      admin?: AuthenticatedAdmin;
    }
  }
}

export {};

import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`Route ${req.method} ${req.path} not found`));
}

function isDuplicateKeyError(error: unknown): error is { code: number; keyValue?: Record<string, unknown> } {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === 11000;
}

// Express identifies error handlers by their four-argument signature.
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  let status = 500;
  let message = "Something went wrong. Please try again.";
  let errors: { field?: string; message: string }[] = [];

  if (error instanceof ApiError) {
    status = error.statusCode;
    message = error.message;
    errors = error.errors;
  } else if (error instanceof ZodError) {
    status = 400;
    message = "Validation failed";
    errors = error.issues.map((issue) => ({ field: issue.path.join(".") || undefined, message: issue.message }));
  } else if (isDuplicateKeyError(error)) {
    status = 409;
    const field = Object.keys(error.keyValue ?? {})[0];
    message = field ? `A record with this ${field} already exists` : "Duplicate record";
    errors = field ? [{ field, message: `${field} is already in use` }] : [];
  } else if (error instanceof mongoose.Error.CastError) {
    status = 400;
    message = "Invalid identifier";
  } else if (error instanceof SyntaxError && "body" in error) {
    status = 400;
    message = "Malformed JSON body";
  }

  if (status >= 500) console.error(error);

  res.status(status).json({ success: false, message, errors });
}

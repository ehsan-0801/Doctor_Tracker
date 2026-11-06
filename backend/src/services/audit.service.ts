import type { Request } from "express";
import type { QueryFilter } from "mongoose";
import { AuditEvent, type AuditEventDocument } from "../models/Audit.js";
import { emitToRoom } from "../realtime/server.js";
import { containsPattern, dateRangeFilter } from "../utils/query.js";
import { buildPagination } from "../utils/response.js";
import type { AuthenticatedUser } from "./auth.service.js";

const SENSITIVE = /password|token|secret|hash/i;

/** Drops sensitive keys and long values so audit entries never store secrets. */
function sanitize(changes: Record<string, unknown> | undefined | null) {
  if (!changes) return null;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined || SENSITIVE.test(key)) continue;
    out[key] = typeof value === "string" && value.length > 300 ? `${value.slice(0, 300)}…` : value;
  }
  return Object.keys(out).length ? out : null;
}

export interface AuditInput {
  action: string;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string;
  changes?: Record<string, unknown> | null;
}

/**
 * Records an audit entry and streams it to admins. Never throws: auditing must
 * not break the action it describes.
 */
export async function recordAudit(req: Request, actor: Pick<AuthenticatedUser, "id" | "name" | "role"> | null, input: AuditInput) {
  try {
    const event = await AuditEvent.create({
      action: input.action,
      actorId: actor?.id ?? null,
      actorName: actor?.name ?? "",
      actorRole: actor?.role ?? "",
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      entityLabel: input.entityLabel ?? "",
      changes: sanitize(input.changes),
      ip: req.ip ?? "",
      userAgent: String(req.get("user-agent") ?? "").slice(0, 300),
    });
    emitToRoom("presence:all", "audit:new", event.toObject());
  } catch (error) {
    console.error("Failed to record audit event", error);
  }
}

export interface AuditQuery {
  page: number;
  limit: number;
  search?: string;
  action?: string;
  entityType?: string;
  actorId?: string;
  startDate?: Date;
  endDate?: Date;
}

export async function listAudit(query: AuditQuery) {
  const filter: QueryFilter<AuditEventDocument> = {};
  if (query.search) {
    const pattern = containsPattern(query.search);
    filter.$or = [{ actorName: pattern }, { entityLabel: pattern }, { action: pattern }];
  }
  if (query.action) filter.action = query.action;
  if (query.entityType) filter.entityType = query.entityType;
  if (query.actorId) filter.actorId = query.actorId;
  const createdAt = dateRangeFilter(query.startDate, query.endDate);
  if (createdAt) filter.createdAt = createdAt;

  const [data, total] = await Promise.all([
    AuditEvent.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    AuditEvent.countDocuments(filter),
  ]);
  return { data, pagination: buildPagination(query.page, query.limit, total) };
}

/** Distinct actions and entity types for the filter dropdowns. */
export async function auditFacets() {
  const [actions, entityTypes] = await Promise.all([AuditEvent.distinct("action"), AuditEvent.distinct("entityType")]);
  return { actions: actions.sort(), entityTypes: entityTypes.sort() };
}

import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * Who did what, when. Actor name/role are snapshotted so the log stays readable
 * after accounts change. Kept for 180 days (TTL index).
 */
const auditEventSchema = new Schema(
  {
    action: { type: String, required: true, maxlength: 60 },
    actorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    actorName: { type: String, default: "" },
    actorRole: { type: String, default: "" },
    entityType: { type: String, required: true, maxlength: 30 },
    entityId: { type: String, default: null },
    entityLabel: { type: String, default: "", maxlength: 200 },
    changes: { type: Schema.Types.Mixed, default: null },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "", maxlength: 300 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditEventSchema.index({ createdAt: -1, _id: -1 });
auditEventSchema.index({ actorId: 1, createdAt: -1 });
auditEventSchema.index({ entityType: 1, createdAt: -1 });
auditEventSchema.index({ action: 1, createdAt: -1 });
auditEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60, name: "audit_ttl" });

export type AuditEventDocument = InferSchemaType<typeof auditEventSchema>;
export const AuditEvent = model("AuditEvent", auditEventSchema, "audit_events");

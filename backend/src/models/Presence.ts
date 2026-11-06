import { Schema, model, type InferSchemaType } from "mongoose";

export const PRESENCE_STATUSES = ["available", "busy", "in_surgery", "on_break", "off_duty"] as const;

/** Current location and status of one user (one document per user). */
const presenceSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    locationId: { type: Schema.Types.ObjectId, ref: "Location", default: null },
    status: { type: String, enum: PRESENCE_STATUSES, default: "off_duty" },
    note: { type: String, trim: true, maxlength: 120, default: "" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

presenceSchema.index({ locationId: 1 });

export type PresenceDocument = InferSchemaType<typeof presenceSchema>;
export const Presence = model("Presence", presenceSchema);

/** Movement history, kept for 30 days (MongoDB TTL index). */
const presenceEventSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    locationId: { type: Schema.Types.ObjectId, ref: "Location", default: null },
    status: { type: String, enum: PRESENCE_STATUSES, required: true },
    note: { type: String, default: "" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

presenceEventSchema.index({ userId: 1, createdAt: -1 });
presenceEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const PresenceEvent = model("PresenceEvent", presenceEventSchema);

import { Schema, model, type InferSchemaType } from "mongoose";

export const NOTIFICATION_TYPES = ["message", "patient_assigned", "patient_unassigned", "location_updated", "staff_assigned", "system"] as const;

/** In-app notification for one user; kept for 90 days. */
const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, maxlength: 120 },
    body: { type: String, default: "", maxlength: 300 },
    link: { type: String, default: "", maxlength: 300 },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60, name: "notification_ttl" });

export type NotificationDocument = InferSchemaType<typeof notificationSchema>;
export const Notification = model("Notification", notificationSchema);

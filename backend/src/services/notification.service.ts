import { Types } from "mongoose";
import { Notification, type NOTIFICATION_TYPES } from "../models/Notification.js";
import { User } from "../models/User.js";
import { emitToUsers } from "../realtime/server.js";

export interface NotificationInput {
  type: (typeof NOTIFICATION_TYPES)[number];
  title: string;
  body?: string;
  link?: string;
}

/** Stores and pushes a notification to each user. Never throws. */
export async function notify(userIds: (string | Types.ObjectId)[], input: NotificationInput) {
  const ids = [...new Set(userIds.map(String))];
  if (!ids.length) return;
  try {
    const docs = await Notification.insertMany(ids.map((userId) => ({ userId, ...input })));
    for (const doc of docs) emitToUsers([doc.userId.toString()], "notification:new", doc.toObject());
  } catch (error) {
    console.error("Failed to send notification", error);
  }
}

/** Login(s) linked to a doctor record. */
export async function doctorUserIds(doctorId: string | Types.ObjectId | null | undefined) {
  if (!doctorId) return [];
  const users = await User.find({ role: "doctor", doctorId, active: true }).select("_id").lean();
  return users.map((u) => u._id.toString());
}

export async function listNotifications(userId: string, limit: number, before?: Date) {
  const me = new Types.ObjectId(userId);
  const [items, unread] = await Promise.all([
    Notification.find({ userId: me, ...(before ? { createdAt: { $lt: before } } : {}) })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean(),
    Notification.countDocuments({ userId: me, read: false }),
  ]);
  return { items, unread, hasMore: items.length === limit };
}

export async function markNotificationRead(userId: string, id: string) {
  await Notification.updateOne({ _id: id, userId }, { read: true });
}

export async function markAllNotificationsRead(userId: string) {
  await Notification.updateMany({ userId, read: false }, { read: true });
}

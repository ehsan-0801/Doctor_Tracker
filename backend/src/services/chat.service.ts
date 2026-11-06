import { Types } from "mongoose";
import type { Role } from "../constants/roles.js";
import { Conversation, Message } from "../models/Chat.js";
import { User } from "../models/User.js";
import { emitToUsers, isOnline } from "../realtime/server.js";
import { ApiError } from "../utils/ApiError.js";
import { type AccessSubject, canChat } from "./access.service.js";
import type { AuthenticatedUser } from "./auth.service.js";
import { notify } from "./notification.service.js";

type LeanUser = {
  _id: Types.ObjectId;
  name: string;
  role: Role;
  photoUrl?: string | null;
  doctorId?: Types.ObjectId | null;
  assignedDoctorIds?: Types.ObjectId[] | null;
};
const USER_FIELDS = "name role photoUrl doctorId assignedDoctorIds";

const subjectOf = (u: LeanUser): AccessSubject => ({
  id: u._id.toString(),
  role: u.role,
  doctorId: u.doctorId?.toString() ?? null,
  assignedDoctorIds: (u.assignedDoctorIds ?? []).map(String),
});
const contactView = (u: LeanUser) => ({ _id: u._id.toString(), name: u.name, role: u.role, photoUrl: u.photoUrl ?? "", online: isOnline(u._id.toString()) });
const pairKey = (a: string, b: string) => [a, b].sort().join(":");

/** People the actor may chat with (admin: everyone). */
export async function listContacts(actor: AuthenticatedUser) {
  let filter: Record<string, unknown>;
  if (actor.role === "admin") filter = { active: true, _id: { $ne: new Types.ObjectId(actor.id) } };
  else if (actor.role === "doctor") {
    filter = { active: true, $or: [{ role: "admin" }, ...(actor.doctorId ? [{ role: { $in: ["staff", "management"] }, assignedDoctorIds: actor.doctorId }] : [])] };
  } else {
    filter = { active: true, $or: [{ role: "admin" }, { role: "doctor", doctorId: { $in: actor.assignedDoctorIds } }] };
  }
  const users = await User.find(filter).select(USER_FIELDS).sort({ role: 1, name: 1 }).limit(500).lean<LeanUser[]>();
  return users.map(contactView);
}

async function loadParticipant(conversationId: string, actor: AuthenticatedUser) {
  const conversation = await Conversation.findById(conversationId).lean();
  if (!conversation || !conversation.participants.some((p) => p.toString() === actor.id)) {
    throw ApiError.notFound("Conversation not found");
  }
  const otherId = conversation.participants.find((p) => p.toString() !== actor.id)!;
  const other = await User.findById(otherId).select(USER_FIELDS).lean<LeanUser>();
  if (!other) throw ApiError.notFound("Conversation not found");
  return { conversation, other };
}

/** Conversations with the other participant and unread counts (one aggregation for all unread counts). */
export async function listConversations(actor: AuthenticatedUser) {
  const me = new Types.ObjectId(actor.id);
  const conversations = await Conversation.find({ participants: me, lastMessageAt: { $ne: null } })
    .sort({ lastMessageAt: -1 })
    .limit(100)
    .lean();
  const otherIds = conversations.map((c) => c.participants.find((p) => p.toString() !== actor.id)!);
  const others = await User.find({ _id: { $in: otherIds } }).select(USER_FIELDS).lean<LeanUser[]>();
  const byId = new Map(others.map((u) => [u._id.toString(), u]));

  const unreadMatch = conversations.map((c) => ({
    conversationId: c._id,
    createdAt: { $gt: c.reads.find((r) => r.userId?.toString() === actor.id)?.at ?? new Date(0) },
  }));
  const unread = unreadMatch.length
    ? await Message.aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: { senderId: { $ne: me }, $or: unreadMatch } },
        { $group: { _id: "$conversationId", count: { $sum: 1 } } },
      ])
    : [];
  const unreadBy = new Map(unread.map((u) => [u._id.toString(), u.count]));

  return conversations.flatMap((c, i) => {
    const other = byId.get(otherIds[i]!.toString());
    if (!other) return [];
    return [{
      _id: c._id.toString(),
      contact: contactView(other),
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt,
      lastSenderId: c.lastSenderId?.toString() ?? null,
      unread: unreadBy.get(c._id.toString()) ?? 0,
      canSend: canChat(subjectOfActor(actor), subjectOf(other)),
    }];
  });
}

const subjectOfActor = (a: AuthenticatedUser): AccessSubject => ({ id: a.id, role: a.role, doctorId: a.doctorId, assignedDoctorIds: a.assignedDoctorIds });

export async function openConversation(actor: AuthenticatedUser, otherUserId: string) {
  const other = await User.findOne({ _id: otherUserId, active: true }).select(USER_FIELDS).lean<LeanUser>();
  if (!other || !canChat(subjectOfActor(actor), subjectOf(other))) throw ApiError.forbidden("You cannot message this person");
  const key = pairKey(actor.id, otherUserId);
  const conversation = await Conversation.findOneAndUpdate(
    { key },
    { $setOnInsert: { key, participants: [new Types.ObjectId(actor.id), new Types.ObjectId(otherUserId)] } },
    { upsert: true, new: true },
  ).lean();
  return { _id: conversation!._id.toString(), contact: contactView(other), canSend: true };
}

export async function listMessages(actor: AuthenticatedUser, conversationId: string, before: string | undefined, limit: number) {
  const { other } = await loadParticipant(conversationId, actor);
  const messages = await Message.find({ conversationId, ...(before ? { createdAt: { $lt: new Date(before) } } : {}) })
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .lean();
  return {
    contact: contactView(other),
    canSend: canChat(subjectOfActor(actor), subjectOf(other)),
    messages: messages.reverse().map((m) => ({ _id: m._id.toString(), senderId: m.senderId.toString(), body: m.body, createdAt: m.createdAt })),
    hasMore: messages.length === limit,
  };
}

export async function sendMessage(actor: AuthenticatedUser, conversationId: string, body: string) {
  const { conversation, other } = await loadParticipant(conversationId, actor);
  // Re-check: an assignment may have been removed since the conversation started.
  if (!canChat(subjectOfActor(actor), subjectOf(other))) throw ApiError.forbidden("You can no longer message this person");

  const message = await Message.create({ conversationId, senderId: actor.id, body });
  const now = message.createdAt;
  await Conversation.updateOne(
    { _id: conversationId },
    {
      $set: { lastMessage: body.slice(0, 140), lastMessageAt: now, lastSenderId: actor.id },
      $pull: { reads: { userId: new Types.ObjectId(actor.id) } },
    },
  );
  await Conversation.updateOne({ _id: conversationId }, { $push: { reads: { userId: new Types.ObjectId(actor.id), at: now } } });

  const payload = {
    conversationId,
    message: { _id: message._id.toString(), senderId: actor.id, body: message.body, createdAt: now },
  };
  emitToUsers([actor.id, other._id.toString()], "chat:message", payload);
  await notify([other._id], {
    type: "message",
    title: `New message from ${actor.name}`,
    body: body.slice(0, 140),
    link: `/messages?c=${conversationId}`,
  });
  void conversation;
  return payload.message;
}

export async function markRead(actor: AuthenticatedUser, conversationId: string) {
  await loadParticipant(conversationId, actor);
  const me = new Types.ObjectId(actor.id);
  await Conversation.updateOne({ _id: conversationId }, { $pull: { reads: { userId: me } } });
  await Conversation.updateOne({ _id: conversationId }, { $push: { reads: { userId: me, at: new Date() } } });
  emitToUsers([actor.id], "chat:read", { conversationId });
}

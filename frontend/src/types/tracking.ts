import type { Role } from "./api";

export const LOCATION_TYPES = ["ot", "icu", "ward", "consultation", "emergency", "lab", "radiology", "pharmacy", "reception", "lounge", "office"] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export const PRESENCE_STATUSES = ["available", "busy", "in_surgery", "on_break", "off_duty"] as const;
export type PresenceStatus = (typeof PRESENCE_STATUSES)[number];

export interface HospitalLocation {
  _id: string;
  name: string;
  code: string;
  type: LocationType;
  floor: number;
  x: number;
  y: number;
  w: number;
  h: number;
  active: boolean;
}

export interface PresenceView {
  userId: string;
  name: string;
  role: Role;
  photoUrl: string;
  specialization: string | null;
  status: PresenceStatus;
  note: string;
  location: Pick<HospitalLocation, "_id" | "name" | "code" | "type" | "floor"> | null;
  updatedAt: string | null;
  canUpdate: boolean;
}

export interface PresenceEventView {
  _id: string;
  status: PresenceStatus;
  note: string;
  createdAt: string;
  location: Pick<HospitalLocation, "_id" | "name" | "code" | "type" | "floor"> | null;
  updatedBy: { _id: string; name: string } | null;
}

export interface ChatContact {
  _id: string;
  name: string;
  role: Role;
  photoUrl: string;
  online: boolean;
}

export interface ConversationSummary {
  _id: string;
  contact: ChatContact;
  lastMessage: string;
  lastMessageAt: string | null;
  lastSenderId: string | null;
  unread: number;
  canSend: boolean;
}

export type AttachmentKind = "image" | "file";

export interface ChatAttachment {
  kind: AttachmentKind;
  url: string;
  name: string;
  size: number;
  width?: number;
  height?: number;
}

export interface ChatMessage {
  _id: string;
  senderId: string;
  body: string;
  attachment: ChatAttachment | null;
  createdAt: string;
}

/** Mirrors the API's attachment rules (backend/src/constants/chat.ts); the server re-checks every upload. */
export const ATTACHMENT_FORMATS: Record<AttachmentKind, readonly string[]> = {
  image: ["jpg", "jpeg", "png", "webp", "gif"],
  file: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "zip"],
};
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

/** Same preview text the API stores for conversation lists. */
export const messagePreview = (m: Pick<ChatMessage, "body" | "attachment">) =>
  (m.body || (m.attachment ? (m.attachment.kind === "image" ? "📷 Photo" : `📎 ${m.attachment.name}`) : "")).slice(0, 140);

export const STATUS_LABELS: Record<PresenceStatus, string> = {
  available: "Available",
  busy: "Busy",
  in_surgery: "In surgery",
  on_break: "On break",
  off_duty: "Off duty",
};

/** Status colours (shared by badges and the 3D map). */
export const STATUS_COLORS: Record<PresenceStatus, string> = {
  available: "#16a34a",
  busy: "#d97706",
  in_surgery: "#dc2626",
  on_break: "#397f91",
  off_duty: "#94a3b8",
};

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  ot: "Operation theatre",
  icu: "ICU",
  ward: "Ward",
  consultation: "Consultation",
  emergency: "Emergency",
  lab: "Laboratory",
  radiology: "Radiology",
  pharmacy: "Pharmacy",
  reception: "Reception",
  lounge: "Lounge",
  office: "Office",
};

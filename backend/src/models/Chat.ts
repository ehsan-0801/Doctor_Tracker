import { Schema, model, type InferSchemaType } from "mongoose";
import { ATTACHMENT_KINDS } from "../constants/chat.js";

/** One-to-one conversation; `key` ("<idA>:<idB>", sorted) makes it unique per pair. */
const conversationSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    participants: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], required: true },
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: null },
    lastSenderId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    // When each participant last read the conversation (unread counts).
    reads: { type: [{ userId: { type: Schema.Types.ObjectId, ref: "User" }, at: Date, _id: false }], default: [] },
  },
  { timestamps: true },
);

conversationSchema.index({ participants: 1, lastMessageAt: -1 });

export type ConversationDocument = InferSchemaType<typeof conversationSchema>;
export const Conversation = model("Conversation", conversationSchema);

const messageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, default: "", trim: true, maxlength: 2000 },
    // Optional photo or document stored on Cloudinary (validated before it is saved).
    attachment: {
      type: new Schema(
        {
          kind: { type: String, enum: ATTACHMENT_KINDS, required: true },
          url: { type: String, required: true },
          name: { type: String, required: true, maxlength: 200 },
          size: { type: Number, required: true },
          width: Number,
          height: Number,
        },
        { _id: false },
      ),
      default: undefined,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

messageSchema.index({ conversationId: 1, createdAt: -1, _id: -1 });

export type MessageDocument = InferSchemaType<typeof messageSchema>;
export const Message = model("Message", messageSchema);

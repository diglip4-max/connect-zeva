// src/models/Message.model.ts
import { Schema, model, Document, Types } from "mongoose";

export type AttachmentType = "image" | "video" | "document" | "audio" | "file";

export interface IAttachment {
  url: string;
  type: AttachmentType;
  fileName: string;
  fileSize: number; // bytes
  mimeType: string;
}

export interface IReaction {
  userId: Types.ObjectId;
  emoji: string;
}

export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  clinicId: string; // denormalized for fast scoped queries
  text?: string;
  links: string[];
  attachments: IAttachment[];
  status: "sent" | "delivered" | "read";
  readBy: Types.ObjectId[]; // for group chat read receipts
  replyTo?: Types.ObjectId; // reply/quote reference
  forwardedFrom?: Types.ObjectId; // naya - original message reference agar forward hua ho
  reactions: IReaction[]; // naya
  mentions: Types.ObjectId[]; // naya - mentioned userIds
  isPinned: boolean; // naya
  pinnedBy?: Types.ObjectId; // naya
  pinnedAt?: Date; // naya
  isEdited: boolean;
  deletedBy?: Types.ObjectId[]; // Users who deleted this message for themselves
  deletedAt?: Date; // When it was deleted
  isDeleted: boolean;
  deletedForEveryone: boolean;
  deletedForMe?: Types.ObjectId[]; // Track users who deleted for themselves
  createdAt: Date;
  updatedAt: Date;
}

const attachmentSchema = new Schema<IAttachment>(
  {
    url: { type: String, required: true },
    type: {
      type: String,
      enum: ["image", "video", "document", "audio", "file"],
      required: true,
    },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
  },
  { _id: false },
);

const reactionSchema = new Schema<IReaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    emoji: { type: String, required: true },
  },
  { _id: false },
);

const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    clinicId: { type: String, required: true, index: true },
    text: { type: String },
    links: { type: [String], default: [] },
    attachments: { type: [attachmentSchema], default: [] },
    status: {
      type: String,
      enum: ["sent", "delivered", "read", "failed"],
      default: "sent",
    },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    replyTo: { type: Schema.Types.ObjectId, ref: "Message" },
    forwardedFrom: { type: Schema.Types.ObjectId, ref: "Message" }, // naya
    reactions: { type: [reactionSchema], default: [] }, // naya
    mentions: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isPinned: { type: Boolean, default: false },
    pinnedBy: { type: Schema.Types.ObjectId, ref: "User" },
    pinnedAt: { type: Date },
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedForEveryone: { type: Boolean, default: false },
    deletedBy: [{ type: Schema.Types.ObjectId, ref: "User" }], // Track who deleted
    deletedAt: { type: Date }, // When deleted it
    deletedForMe: [{ type: Schema.Types.ObjectId, ref: "User" }], // Users who hid it
  },
  { timestamps: true },
);

// Most important index - fetching messages of a conversation, latest first (pagination)
messageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message = model<IMessage>("Message", messageSchema);

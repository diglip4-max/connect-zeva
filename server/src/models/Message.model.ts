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

export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  clinicId: string; // denormalized for fast scoped queries
  text?: string;
  attachments: IAttachment[];
  status: "sent" | "delivered" | "read";
  readBy: Types.ObjectId[]; // for group chat read receipts
  replyTo?: Types.ObjectId; // reply/quote reference
  isEdited: boolean;
  isDeleted: boolean;
  deletedForEveryone: boolean;
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
    attachments: { type: [attachmentSchema], default: [] },
    status: {
      type: String,
      enum: ["sent", "delivered", "read", "failed"],
      default: "sent",
    },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    replyTo: { type: Schema.Types.ObjectId, ref: "Message" },
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedForEveryone: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Most important index - fetching messages of a conversation, latest first (pagination)
messageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message = model<IMessage>("Message", messageSchema);

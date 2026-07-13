// src/models/Conversation.model.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IConversation extends Document {
  clinicId: string;
  type: "direct" | "group";
  members: Types.ObjectId[]; // User refs
  groupName?: string; // only for type: "group"
  groupAvatarUrl?: string;
  admins?: Types.ObjectId[]; // only for type: "group"
  lastMessage?: Types.ObjectId; // ref to Message, for conversation list preview
  lastMessageAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    clinicId: { type: String, required: true, index: true },
    type: { type: String, enum: ["direct", "group"], required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    groupName: { type: String },
    groupAvatarUrl: { type: String },
    admins: [{ type: Schema.Types.ObjectId, ref: "User" }],
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
    lastMessageAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

// Fast lookup: all conversations of a clinic, sorted by recent activity
conversationSchema.index({ clinicId: 1, lastMessageAt: -1 });
// Fast lookup: find direct conversation between two members (used to avoid duplicate 1-1 threads)
conversationSchema.index({ clinicId: 1, type: 1, members: 1 });

export const Conversation = model<IConversation>(
  "Conversation",
  conversationSchema,
);

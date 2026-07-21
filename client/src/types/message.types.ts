import type { ConversationMember } from "./conversation.types";

export interface Reaction {
  userId: string;
  emoji: string;
}

export interface Reaction {
  userId: string;
  emoji: string;
}

export interface Attachment {
  url: string;
  type: "image" | "video" | "document" | "audio" | "file";
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface MessageDTO {
  _id: string;
  conversationId: string;
  senderId: ConversationMember;
  text?: string;
  attachments: Attachment[];
  status: "sent" | "delivered" | "read";
  replyTo?: string;
  replyToMessage?: { text?: string; senderName?: string }; // populated preview ke liye
  forwardedFrom?: string;
  reactions: Reaction[];
  isPinned?: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  deletedForEveryone: boolean;
  createdAt: string;
}

export interface SharedLinkEntry {
  url: string;
  createdAt: string;
  senderId: string;
}

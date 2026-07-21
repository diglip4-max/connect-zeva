// src/types/conversation.types.ts (update)
export interface Conversation {
  _id: string;
  type: "direct" | "group";
  members: {
    _id: string;
    name: string;
    avatarUrl?: string;
    role: string;
    isOnline: boolean;
  }[];
  groupName?: string;
  groupAvatarUrl?: string;
  lastMessage?: { text?: string };
  lastMessageAt?: string;
  unreadCount?: number;
  admins?: string[];
}

export interface StaffMember {
  _id: string;
  name: string;
  avatarUrl?: string;
  role: string;
  isOnline: boolean;
}

export interface UnifiedChatList {
  conversations: Conversation[];
  staffWithoutConversation: StaffMember[];
}

export interface ConversationMember {
  _id: string;
  name: string;
  avatarUrl?: string;
  role: string;
  isOnline: boolean;
}

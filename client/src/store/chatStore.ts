import { create } from "zustand";

interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  attachments: any[];
  createdAt: string;
  status: "sent" | "delivered" | "read";
}

interface ChatState {
  activeConversationId: string | null;
  pendingRecipientId: string | null; // staff select hua hai, conversation abhi bana nahi
  messages: Record<string, Message[]>; // keyed by conversationId
  typingUsers: Record<string, string[]>; // conversationId -> array of userIds typing

  selectConversation: (conversationId: string) => void;
  selectStaffRecipient: (userId: string) => void;
  clearActiveChat: () => void;

  addMessage: (conversationId: string, message: Message) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  setTyping: (
    conversationId: string,
    userId: string,
    isTyping: boolean,
  ) => void;

  /**
   * jab pehla message "recipientId" ke through bheja jaye aur backend
   * ek naya conversationId return kare, isko call karo taaki
   * pendingRecipientId -> activeConversationId me smoothly transition ho jaye
   */
  resolvePendingToConversation: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>((set, _get) => ({
  activeConversationId: null,
  pendingRecipientId: null,
  messages: {},
  typingUsers: {},

  selectConversation: (conversationId) =>
    set({ activeConversationId: conversationId, pendingRecipientId: null }),

  selectStaffRecipient: (userId) =>
    set({ pendingRecipientId: userId, activeConversationId: null }),

  clearActiveChat: () =>
    set({ activeConversationId: null, pendingRecipientId: null }),

  addMessage: (conversationId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), message],
      },
    })),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: messages },
    })),

  setTyping: (conversationId, userId, isTyping) =>
    set((state) => {
      const current = state.typingUsers[conversationId] || [];
      const updated = isTyping
        ? [...new Set([...current, userId])]
        : current.filter((id) => id !== userId);
      return {
        typingUsers: { ...state.typingUsers, [conversationId]: updated },
      };
    }),

  resolvePendingToConversation: (conversationId) =>
    set({ activeConversationId: conversationId, pendingRecipientId: null }),
}));

import type {
  Conversation,
  ConversationMember,
} from "@/types/conversation.types";
import type { MessageDTO, Reaction } from "@/types/message.types";
import { create } from "zustand";

interface ChatState {
  activeConversationId: string | null;
  pendingRecipientId: string | null; // staff select hua hai, conversation abhi bana nahi
  messages: Record<string, MessageDTO[]>; // keyed by conversationId
  selectedConversation: Conversation | null;
  typingUsers: Record<string, string[]>; // conversationId -> array of userIds typing

  replyingTo: { messageId: string; text?: string; senderName: string } | null;
  setReplyingTo: (data: ChatState["replyingTo"]) => void;

  //   Scroll to a specific message
  scrollToMessageId: string | null;
  setScrollToMessageId: (messageId: string | null) => void;

  selectConversation: (conversation: Conversation) => void;
  selectStaffRecipient: (userId: string) => void;
  clearActiveChat: () => void;

  addMessage: (conversationId: string, message: MessageDTO) => void;
  setMessages: (conversationId: string, messages: MessageDTO[]) => void;
  setTyping: (
    conversationId: string,
    userId: string,
    isTyping: boolean,
  ) => void;

  updateMessageStatus: (
    conversationId: string,
    messageId: string,
    status: "sent" | "delivered" | "read",
  ) => void;

  updateMessageReactions: (
    conversationId: string,
    messageId: string,
    reactions: Reaction[],
  ) => void;
  updateMessageText: (
    conversationId: string,
    messageId: string,
    text: string,
  ) => void;
  markMessageDeleted: (conversationId: string, messageId: string) => void;
  updateConversationMembers: (
    conversationId: string,
    members: ConversationMember[],
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
  selectedConversation: null,
  replyingTo: null,
  scrollToMessageId: null,
  setReplyingTo: (data) => set({ replyingTo: data }),
  setScrollToMessageId: (messageId) => set({ scrollToMessageId: messageId }),

  selectConversation: (conversation) =>
    set({
      activeConversationId: conversation._id,
      selectedConversation: conversation,
      pendingRecipientId: null,
    }),

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

  updateMessageStatus: (conversationId, messageId, status) =>
    set((state) => {
      const conversationMessages = state.messages[conversationId];
      if (!conversationMessages) return state;

      return {
        messages: {
          ...state.messages,
          [conversationId]: conversationMessages.map((msg) =>
            msg._id === messageId ? { ...msg, status } : msg,
          ),
        },
      };
    }),

  // implementations
  updateMessageReactions: (conversationId, messageId, reactions) =>
    set((state) => {
      const messages = state.messages[conversationId];
      if (!messages) return state;
      return {
        messages: {
          ...state.messages,
          [conversationId]: messages.map((m) =>
            m._id === messageId ? { ...m, reactions } : m,
          ),
        },
      };
    }),

  updateMessageText: (conversationId, messageId, text) =>
    set((state) => {
      const messages = state.messages[conversationId];
      if (!messages) return state;
      return {
        messages: {
          ...state.messages,
          [conversationId]: messages.map((m) =>
            m._id === messageId ? { ...m, text, isEdited: true } : m,
          ),
        },
      };
    }),

  markMessageDeleted: (conversationId, messageId) =>
    set((state) => {
      const messages = state.messages[conversationId];
      if (!messages) return state;
      return {
        messages: {
          ...state.messages,
          [conversationId]: messages.map((m) =>
            m._id === messageId
              ? { ...m, isDeleted: true, text: undefined, attachments: [] }
              : m,
          ),
        },
      };
    }),

  updateConversationMembers: (conversationId, members) =>
    set((state) => {
      if (state.selectedConversation?._id !== conversationId) return state;
      return {
        selectedConversation: { ...state.selectedConversation, members },
      };
    }),

  resolvePendingToConversation: (conversationId) =>
    set({ activeConversationId: conversationId, pendingRecipientId: null }),
}));

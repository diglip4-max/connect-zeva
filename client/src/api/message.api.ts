// src/api/message.api.ts
import axiosClient from "./axiosClient";
import type {
  MessageDTO,
  SharedFileItem,
  SharedLinkEntry,
  SharedMediaItem,
} from "@/types/message.types";

export const fetchMessages = async (
  conversationId: string,
  cursor?: string,
): Promise<MessageDTO[]> => {
  const { data } = await axiosClient.get(`/messages/${conversationId}`, {
    params: cursor ? { cursor } : {},
  });
  return data.data;
};

export const markMessagesRead = async (conversationId: string) => {
  await axiosClient.post(`/messages/${conversationId}/read`);
};

export const sendMessage = async (payload: {
  conversationId?: string;
  recipientId?: string;
  text?: string;
  attachments?: any[];
  replyTo?: string;
}) => {
  const { data } = await axiosClient.post("/messages/send", payload);
  return data.data;
};

export const fetchSharedLinks = async (
  conversationId: string,
): Promise<SharedLinkEntry[]> => {
  const { data } = await axiosClient.get(`/messages/${conversationId}/links`);
  return data.data;
};

export const reactToMessage = async (messageId: string, emoji: string) => {
  const { data } = await axiosClient.post(`/messages/${messageId}/react`, {
    emoji,
  });
  return data.data;
};

export const editMessage = async (messageId: string, text: string) => {
  const { data } = await axiosClient.patch(`/messages/${messageId}`, { text });
  return data.data;
};

export const deleteMessage = async (
  messageId: string,
  forEveryone: boolean,
) => {
  const { data } = await axiosClient.delete(`/messages/${messageId}`, {
    data: { forEveryone },
  });
  return data.data;
};

export const forwardMessage = async (
  messageId: string,
  targetConversationIds: string[],
) => {
  const { data } = await axiosClient.post(`/messages/${messageId}/forward`, {
    targetConversationIds,
  });
  return data.data;
};

export const fetchSharedMedia = async (
  conversationId: string,
): Promise<SharedMediaItem[]> => {
  const { data } = await axiosClient.get(`/messages/${conversationId}/media`);
  return data.data;
};

export const fetchSharedFiles = async (
  conversationId: string,
): Promise<SharedFileItem[]> => {
  const { data } = await axiosClient.get(`/messages/${conversationId}/files`);
  return data.data;
};

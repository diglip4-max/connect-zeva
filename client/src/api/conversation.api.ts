// src/api/conversation.api.ts (update)
import axiosClient from "./axiosClient";
import type { UnifiedChatList } from "@/types/conversation.types";

export const fetchChatList = async (): Promise<UnifiedChatList> => {
  const { data } = await axiosClient.get<{
    success: boolean;
    message: string;
    data: UnifiedChatList;
  }>("/conversations");
  return data.data;
};

export const createGroupConversation = async (
  groupName: string,
  memberIds: string[],
) => {
  const { data } = await axiosClient.post("/conversations/group", {
    groupName,
    memberIds,
  });
  return data.data;
};

export const makeGroupAdmin = async (
  conversationId: string,
  userId: string,
) => {
  const { data } = await axiosClient.post("/conversations/group/make-admin", {
    conversationId,
    userId,
  });
  return data.data;
};

export const removeGroupAdmin = async (
  conversationId: string,
  userId: string,
) => {
  const { data } = await axiosClient.post("/conversations/group/remove-admin", {
    conversationId,
    userId,
  });
  return data.data;
};

export const addGroupMembers = async (
  conversationId: string,
  memberIds: string[],
) => {
  const { data } = await axiosClient.post("/conversations/group/add-members", {
    conversationId,
    memberIds,
  });
  return data.data;
};

export const removeGroupMember = async (
  conversationId: string,
  userId: string,
) => {
  const { data } = await axiosClient.post(
    "/conversations/group/remove-member",
    { conversationId, userId },
  );
  return data.data;
};

export const leaveGroup = async (conversationId: string) => {
  const { data } = await axiosClient.post(
    `/conversations/${conversationId}/leave`,
  );
  return data.data;
};

export const updateGroupSettings = async (
  conversationId: string,
  updates: { groupName?: string; groupAvatarUrl?: string },
) => {
  const { data } = await axiosClient.patch(
    `/conversations/${conversationId}/settings`,
    updates,
  );
  return data.data;
};

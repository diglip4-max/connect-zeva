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

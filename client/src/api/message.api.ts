import type { MessageDTO } from "@/types/message.types";
import axiosClient from "./axiosClient";

export const fetchMessages = async (
  conversationId: string,
): Promise<MessageDTO[]> => {
  const { data } = await axiosClient.get(`/messages/${conversationId}`);
  return data.data;
};

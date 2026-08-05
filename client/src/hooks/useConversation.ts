import { fetchConversation } from "@/api/conversation.api";
import { useChatStore } from "@/store/chatStore";
import { useQuery } from "@tanstack/react-query";
import React from "react";

const useConversation = ({ conversationId }: { conversationId: string }) => {
  const { selectedConversation, selectConversation } = useChatStore();
  const {
    data: conversation,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => fetchConversation(conversationId),
  });

  React.useEffect(() => {
    if (conversation) selectConversation(conversation);
  }, [conversation]);

  return {
    selectedConversation,
    isLoading,
    error,
  };
};

export default useConversation;

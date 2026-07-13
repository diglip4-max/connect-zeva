import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchMessages } from "@/api/message.api";
import { useChatStore } from "@/store/chatStore";

export function useMessages(conversationId: string | null) {
  const setMessages = useChatStore((s) => s.setMessages);
  const storeMessages = useChatStore((s) =>
    conversationId ? s.messages[conversationId] : undefined,
  );

  const query = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => fetchMessages(conversationId!),
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (query.data && conversationId) {
      setMessages(conversationId, query.data);
    }
  }, [query.data, conversationId, setMessages]);

  return {
    messages: storeMessages || [],
    isLoading: query.isLoading,
  };
}

// src/hooks/useMessages.ts
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { fetchMessages } from "@/api/message.api";
import { useChatStore } from "@/store/chatStore";
import type { MessageDTO } from "@/types/message.types";

const PAGE_SIZE = 30;

export function useMessages(conversationId: string | null) {
  const setMessages = useChatStore((s) => s.setMessages);
  const storeMessages = useChatStore((s) =>
    conversationId ? s.messages[conversationId] : undefined,
  );

  const query = useInfiniteQuery({
    queryKey: ["messages", conversationId],
    queryFn: ({ pageParam }) => fetchMessages(conversationId!, pageParam),
    enabled: !!conversationId,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      // agar page full mila (PAGE_SIZE ke barabar), aur purane messages ho sakte hain
      if (lastPage.length < PAGE_SIZE) return undefined;
      return lastPage[0]?._id; // sabse purana message is page ka, agla cursor banega
    },
  });

  // saare pages ko flatten karke chronological order me lao
  const allMessages = useMemo(() => {
    if (!query.data) return [];
    // pages reverse order me hain (naya page = purane messages), isliye reverse karke concat
    return [...query.data.pages].reverse().flatMap((page) => page);
  }, [query.data]);

  useEffect(() => {
    if (conversationId && allMessages.length > 0) {
      setMessages(conversationId, allMessages as MessageDTO[]);
    }
  }, [allMessages, conversationId, setMessages]);

  return {
    messages: storeMessages || [],
    isLoading: query.isLoading,
    isFetchingOlder: query.isFetchingNextPage,
    hasMoreOlder: query.hasNextPage,
    loadOlderMessages: query.fetchNextPage,
  };
}

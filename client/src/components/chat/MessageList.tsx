// src/components/chat/MessageList.tsx
import { useEffect, useRef } from "react";
import { MessageCircle, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import MessageBubble from "./MessageBubble";
import type { MessageDTO } from "@/types/message.types";

interface MessageListProps {
  messages: MessageDTO[];
  isLoading: boolean;
  currentUserId: string;
  recipientName?: string;
}

const MessageList = ({
  messages,
  isLoading,
  currentUserId,
  recipientName,
}: MessageListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={i % 2 === 0 ? "flex justify-start" : "flex justify-end"}
          >
            <Skeleton className="h-10 w-48 rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 animate-pulse rounded-full bg-primary/10" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/15">
            <MessageCircle
              className="h-7 w-7 text-primary"
              strokeWidth={1.75}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-base font-semibold tracking-tight text-foreground">
            {recipientName
              ? `Say hello to ${recipientName}`
              : "No messages yet"}
          </p>
          <p className="max-w-[240px] text-sm text-muted-foreground">
            This is the beginning of your conversation. Send a message to get
            started.
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
          <Send className="h-3 w-3" />
          <span>Type below to send your first message</span>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col gap-2 p-4">
        {messages.map((msg) => (
          <MessageBubble
            key={msg._id}
            text={msg.text}
            createdAt={msg.createdAt}
            status={msg.status}
            isOwn={msg.senderId === currentUserId}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
};

export default MessageList;

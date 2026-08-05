// src/components/chat/MessageList.tsx
import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import ForwardMessageDialog from "./ForwardMessageDialog";
import type { MessageDTO } from "@/types/message.types";
import { useChatStore } from "@/store/chatStore";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface MessageListProps {
  messages: MessageDTO[];
  isLoading: boolean;
  isFetchingOlder: boolean;
  hasMoreOlder: boolean;
  onLoadOlder: () => void;
  currentUserId: string;
  recipientName?: string;
  isOtherUserTyping?: boolean;
  typingUserName?: string;
  typingUserAvatarUrl?: string;
  showTypingAvatar?: boolean;
}

const MessageList = ({
  messages,
  isLoading,
  isFetchingOlder,
  hasMoreOlder,
  onLoadOlder,
  currentUserId,
  recipientName,
  isOtherUserTyping,
  typingUserName,
  typingUserAvatarUrl,
  showTypingAvatar,
}: MessageListProps) => {
  const { user } = useAuth();
  const selectedConversation = useChatStore((s) => s.selectedConversation);
  const setReplyingTo = useChatStore((s) => s.setReplyingTo);
  const isGroup = selectedConversation?.type === "group";

  const bottomRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  const [forwardMessageId, setForwardMessageId] = useState<string | null>(null);

  const isGroupType = selectedConversation?.type === "group";
  const isCurrentUserAdmin =
    selectedConversation?.admins?.includes(user?.id || "") ?? false;
  const canPin = isGroupType ? isCurrentUserAdmin : true;

  //   For Highlighting the message and scroll to a specific message
  const scrollToMessageId = useChatStore((s) => s.scrollToMessageId);
  const setScrollToMessageId = useChatStore((s) => s.setScrollToMessageId);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (isFirstLoad.current && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
      isFirstLoad.current = false;
    } else if (!isFetchingOlder) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isOtherUserTyping]);

  useEffect(() => {
    if (!topSentinelRef.current || !hasMoreOlder) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingOlder) {
          onLoadOlder();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(topSentinelRef.current);
    return () => observer.disconnect();
  }, [hasMoreOlder, isFetchingOlder, onLoadOlder]);

  // useEffect - scrollToMessageId change hone par scroll+highlight karo
  useEffect(() => {
    if (!scrollToMessageId) return;

    const targetElement = messageRefs.current[scrollToMessageId];
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedId(scrollToMessageId);

      // 2 second baad highlight hata do
      const timeout = setTimeout(() => {
        setHighlightedId(null);
        setScrollToMessageId(null); // reset, taaki dobara same message pe click karne pe re-trigger ho sake
      }, 2000);

      return () => clearTimeout(timeout);
    } else {
      // message abhi loaded nahi hai (purana, pagination se aana baaki hai)
      console.warn(
        "Message not currently loaded - would need to fetch older messages",
      );
      setScrollToMessageId(null);

      //   onLoadOlder();
    }
  }, [scrollToMessageId, setScrollToMessageId]);

  // reply hone wale message ka text/sender-name nikalne ka helper
  const getReplyPreview = (replyToId?: string) => {
    if (!replyToId) return null;
    const repliedMessage = messages.find((m) => m._id === replyToId);
    if (!repliedMessage) return null;

    return {
      text: repliedMessage.text || "Attachment",
      senderName: repliedMessage.senderId.name,
    };
  };

  const handleReply = (msg: MessageDTO) => {
    setReplyingTo({
      messageId: msg._id,
      text: msg.text,
      senderName: msg.senderId.name,
    });
  };

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

  if (messages.length === 0 && !isOtherUserTyping) {
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
    <>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-4">
          {hasMoreOlder && (
            <div ref={topSentinelRef} className="flex justify-center py-2">
              {isFetchingOlder && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          )}

          {messages.map((msg, _index: number) => {
            const isOwn = msg.senderId._id === currentUserId;
            // const prevMsg = messages[index - 1];
            // const nextMsg =
            //   index < messages.length - 1 ? messages[index + 1] : undefined;
            const showAvatar = isGroup && !isOwn;
            // &&
            // (!nextMsg || nextMsg.senderId._id !== msg.senderId._id);

            const senderInfo = isGroup ? msg.senderId : msg.senderId;
            const replyPreview = getReplyPreview(msg.replyTo);

            const isHighlighted = highlightedId === msg._id;

            return (
              <div
                key={msg._id}
                ref={(el) => {
                  messageRefs.current[msg._id] = el;
                }}
                className={cn(
                  "rounded-2xl transition-colors duration-500",
                  isHighlighted && "bg-primary/10",
                )}
              >
                <MessageBubble
                  message={msg}
                  messageId={msg._id}
                  text={msg.text}
                  attachments={msg.attachments}
                  createdAt={msg.createdAt}
                  status={msg.status}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  senderName={senderInfo?.name}
                  senderAvatarUrl={senderInfo?.avatarUrl}
                  reactions={msg.reactions}
                  isEdited={msg.isEdited}
                  isDeleted={msg.isDeleted}
                  forwardedFrom={msg.forwardedFrom}
                  replyToText={replyPreview?.text}
                  replyToSenderName={replyPreview?.senderName}
                  currentUserId={currentUserId}
                  conversationId={selectedConversation?._id || ""}
                  isPinned={msg.isPinned ?? false}
                  canPin={canPin}
                  onReply={() => handleReply(msg)}
                  onForward={() => setForwardMessageId(msg._id)}
                />
              </div>
            );
          })}

          {isOtherUserTyping && (
            <TypingIndicator
              showAvatar={showTypingAvatar}
              typingUserName={typingUserName}
              typingUserAvatarUrl={typingUserAvatarUrl}
            />
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <ForwardMessageDialog
        messageId={forwardMessageId}
        open={!!forwardMessageId}
        onOpenChange={(open) => !open && setForwardMessageId(null)}
      />
    </>
  );
};

export default MessageList;

// src/components/chat/ChatWindow.tsx
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useSocketEvent } from "@/hooks/useSocket";
import { useSocketContext } from "@/context/SocketContext";
import { useChatStore } from "@/store/chatStore";
import { useMessages } from "@/hooks/useMessages";
import { getInitials } from "@/lib/formatDate";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import type { MessageDTO, Reaction } from "@/types/message.types";
import { useUIStore } from "@/store/uiStore";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, Info } from "lucide-react";
import PinnedMessagesBar from "./PinnedMessagesBar";

const EMPTY_TYPING_ARRAY: string[] = [];

interface ChatWindowProps {
  conversationId: string | null;
  recipientId: string | null;
  displayName: string;
  avatarUrl?: string;
  isOnline?: boolean;
  conversationType?: string;
  onlineCount?: number;
  onBack?: () => void; // naya - mobile back button ke liye
}

const ChatWindow = ({
  conversationId,
  recipientId,
  displayName,
  avatarUrl,
  isOnline,
  conversationType,
  onlineCount = 0,
  onBack,
}: ChatWindowProps) => {
  const { user } = useAuth();
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();

  const addMessage = useChatStore((s) => s.addMessage);
  const setTyping = useChatStore((s) => s.setTyping);
  const updateMessageStatus = useChatStore((s) => s.updateMessageStatus);
  const updateMessageReactions = useChatStore((s) => s.updateMessageReactions);
  const updateMessageText = useChatStore((s) => s.updateMessageText);
  const updateConversationMembers = useChatStore(
    (s) => s.updateConversationMembers,
  );
  const markMessageDeleted = useChatStore((s) => s.markMessageDeleted);
  const resolvePendingToConversation = useChatStore(
    (s) => s.resolvePendingToConversation,
  );

  const isInfoPanelOpen = useUIStore((s) => s.isInfoPanelOpen);
  const toggleInfoPanel = useUIStore((s) => s.toggleInfoPanel);

  const typingUsers = useChatStore((s) =>
    conversationId
      ? (s.typingUsers[conversationId] ?? EMPTY_TYPING_ARRAY)
      : EMPTY_TYPING_ARRAY,
  );

  const {
    messages,
    isLoading,
    isFetchingOlder,
    hasMoreOlder,
    loadOlderMessages,
  } = useMessages(conversationId);

  const selectedConversation = useChatStore((s) => s.selectedConversation);
  const isGroup = selectedConversation?.type === "group";

  // typingUsers already tere paas hai (array of userIds)
  const otherTypingUserId = typingUsers.find((id) => id !== user?.id);
  const otherUserTyping = !!otherTypingUserId;

  // group ke case me, typing kar rahe user ka naam/avatar members se nikालो
  const typingMember = isGroup
    ? selectedConversation?.members.find((m) => m._id === otherTypingUserId)
    : undefined;

  useSocketEvent<MessageDTO>("message:new", (msg) => {
    addMessage(msg.conversationId, msg);
    if (recipientId && !conversationId) {
      resolvePendingToConversation(msg.conversationId);
    }
    queryClient.invalidateQueries({ queryKey: ["chat-list"] });
  });

  useSocketEvent<{ conversationId: string; userId: string }>(
    "typing:start",
    (data) => {
      console.log({ TypingData: data });
      setTyping(data.conversationId, data.userId, true);
    },
  );

  useSocketEvent<{ conversationId: string; userId: string }>(
    "typing:stop",
    (data) => {
      setTyping(data.conversationId, data.userId, false);
    },
  );

  useSocketEvent<{ conversationId: string; messageId: string; userId: string }>(
    "message:read",
    (data) => {
      updateMessageStatus(data.conversationId, data.messageId, "read");
    },
  );

  //   Other message events
  useSocketEvent<{ messageId: string; reactions: Reaction[] }>(
    "message:reaction",
    (data) => {
      if (conversationId)
        updateMessageReactions(conversationId, data.messageId, data.reactions);
    },
  );

  useSocketEvent<{ messageId: string; text?: string }>(
    "message:edited",
    (data) => {
      if (conversationId && data.text)
        updateMessageText(conversationId, data.messageId, data.text);
    },
  );

  useSocketEvent<{ messageId: string }>("message:deleted", (data) => {
    if (conversationId) markMessageDeleted(conversationId, data.messageId);
  });

  useSocketEvent<{
    conversationId: string;
    members: {
      _id: string;
      name: string;
      avatarUrl?: string;
      role: string;
      isOnline: boolean;
    }[];
  }>("conversation:membersAdded", (data) => {
    if (data.conversationId === conversationId) {
      // selectedConversation store me members update karo
      updateConversationMembers(conversationId, data.members);
    }
  });

  useSocketEvent<{
    conversationId: string;
    members: {
      _id: string;
      name: string;
      avatarUrl?: string;
      role: string;
      isOnline: boolean;
    }[];
  }>("conversation:membersRemoved", (data) => {
    if (data.conversationId === conversationId) {
      // selectedConversation store me members update karo
      updateConversationMembers(conversationId, data.members);
    }
  });

  useEffect(() => {
    if (!conversationId || !socket || !user || messages.length === 0) return;

    const unreadIds = messages
      .filter((m) => m.senderId._id !== user.id && !m.readBy?.includes(user.id))
      .map((m) => m._id);

    unreadIds.forEach((messageId) => {
      socket.emit("message:markRead", { conversationId, messageId });

      // turant chat-list query bhi invalidate karo, taaki badge turant clear ho
      queryClient.invalidateQueries({ queryKey: ["chat-list"] });
    });
  }, [conversationId, messages.length, socket, user?.id, queryClient]);

  if (!user) return null;

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
        {/* Back button - sirf mobile pe dikhega */}
        {onBack && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            className="shrink-0 md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        <div className="relative">
          <Avatar className="h-9 w-9">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          {isOnline && conversationType === "direct" && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{displayName}</p>
          {isOnline !== undefined && conversationType === "direct" && (
            <p className="text-xs text-muted-foreground">
              {isOnline ? "Online" : "Offline"}
            </p>
          )}
          {typingMember?.name && conversationType === "group" ? (
            <p className="text-xs text-primary">
              {typingMember?.name} is typing...
            </p>
          ) : (
            onlineCount > 0 &&
            conversationType === "group" && (
              <p className="text-xs text-muted-foreground">
                {onlineCount} online
              </p>
            )
          )}
        </div>

        {!isInfoPanelOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleInfoPanel}
            className={cn("rounded-sm", isInfoPanelOpen && "bg-muted")}
          >
            <Info className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>

      {/* Pinned messages bar */}
      {conversationId && <PinnedMessagesBar conversationId={conversationId} />}

      <MessageList
        messages={messages}
        isLoading={isLoading}
        isFetchingOlder={isFetchingOlder}
        hasMoreOlder={!!hasMoreOlder}
        onLoadOlder={loadOlderMessages}
        currentUserId={user.id}
        recipientName={recipientId ? displayName : undefined}
        isOtherUserTyping={otherUserTyping}
        showTypingAvatar={isGroup}
        typingUserName={typingMember?.name}
        typingUserAvatarUrl={typingMember?.avatarUrl}
      />

      <MessageInput conversationId={conversationId} recipientId={recipientId} />
    </div>
  );
};

export default ChatWindow;

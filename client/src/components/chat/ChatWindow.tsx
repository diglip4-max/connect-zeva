import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useSocketEvent } from "@/hooks/useSocket";
import { useChatStore } from "@/store/chatStore";
import { useMessages } from "@/hooks/useMessages";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import type { MessageDTO } from "@/types/message.types";
import { getInitials } from "@/lib/formatDate";

interface ChatWindowProps {
  conversationId: string | null;
  recipientId: string | null;
  displayName: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

const EMPTY_TYPING_ARRAY: string[] = []; // module-level, ek hi baar banta hai

// Test ke liye - temporarily ChatWindow.tsx ya kahin bhi use kar sakta hai
export const sampleMessages: MessageDTO[] = [
  {
    _id: "msg_001",
    conversationId: "conv_test_123",
    senderId: "user_other_456", // doosra user
    text: "Hey, are you available for the patient consultation at 3 PM today?",
    attachments: [],
    status: "read",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min pehle
  },
  {
    _id: "msg_002",
    conversationId: "conv_test_123",
    senderId: "user_me_789", // apna user (current logged in)
    text: "Yes, I'll be there. Just finishing up with another patient.",
    attachments: [],
    status: "read",
    createdAt: new Date(Date.now() - 1000 * 60 * 43).toISOString(),
  },
  {
    _id: "msg_003",
    conversationId: "conv_test_123",
    senderId: "user_other_456",
    text: "Perfect, thanks! Also, can you check the lab reports for Mr. Sharma before the consultation?",
    attachments: [],
    status: "read",
    createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
  },
  {
    _id: "msg_004",
    conversationId: "conv_test_123",
    senderId: "user_me_789",
    text: "Sure, I'll go through them now.",
    attachments: [],
    status: "read",
    createdAt: new Date(Date.now() - 1000 * 60 * 38).toISOString(),
  },
  {
    _id: "msg_005",
    conversationId: "conv_test_123",
    senderId: "user_other_456",
    text: "Great, let me know if you find anything concerning.",
    attachments: [],
    status: "delivered",
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    _id: "msg_006",
    conversationId: "conv_test_123",
    senderId: "user_me_789",
    text: "Reports look fine overall, just a slightly elevated WBC count. Nothing alarming, we'll monitor it.",
    attachments: [],
    status: "delivered",
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    _id: "msg_007",
    conversationId: "conv_test_123",
    senderId: "user_other_456",
    text: "Got it. See you at 3!",
    attachments: [],
    status: "sent",
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
  {
    _id: "msg_008",
    conversationId: "conv_test_123",
    senderId: "user_me_789",
    text: "👍",
    attachments: [],
    status: "sent",
    createdAt: new Date(Date.now() - 1000 * 30).toISOString(), // 30 sec pehle
  },
];

const ChatWindow = ({
  conversationId,
  recipientId,
  displayName,
  avatarUrl,
  isOnline,
}: ChatWindowProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addMessage = useChatStore((s) => s.addMessage);
  const resolvePendingToConversation = useChatStore(
    (s) => s.resolvePendingToConversation,
  );

  const typingUsers = useChatStore((s) =>
    conversationId
      ? (s.typingUsers[conversationId] ?? EMPTY_TYPING_ARRAY)
      : EMPTY_TYPING_ARRAY,
  );

  const { messages, isLoading } = useMessages(conversationId);

  const otherUserTyping = typingUsers.some((id) => id !== user?.id);

  // real-time: naya message aaye
  useSocketEvent<MessageDTO>("message:new", (msg) => {
    addMessage(msg.conversationId, msg);

    // agar yeh "pending recipient" flow tha (conversation abhi tak exist nahi karta tha),
    // ab backend ne naya conversationId de diya hai - state ko resolve karo
    if (recipientId && !conversationId) {
      resolvePendingToConversation(msg.conversationId);
    }

    queryClient.invalidateQueries({ queryKey: ["chat-list"] });
  });

  if (!user) return null;

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{displayName}</p>
          {isOnline !== undefined && (
            <p className="text-xs text-muted-foreground">
              {isOnline ? "Online" : "Offline"}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        isLoading={isLoading}
        currentUserId={user.id}
      />

      {otherUserTyping && <TypingIndicator />}

      {/* Input */}
      <MessageInput conversationId={conversationId} recipientId={recipientId} />
    </div>
  );
};

export default ChatWindow;

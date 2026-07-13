// src/pages/ChatPage.tsx
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareText } from "lucide-react";
import { useSocketEvent } from "@/hooks/useSocket";
import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import { fetchChatList } from "@/api/conversation.api";
import { useChatStore } from "@/store/chatStore";

const ChatPage = () => {
  const queryClient = useQueryClient();

  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const pendingRecipientId = useChatStore((s) => s.pendingRecipientId);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const selectStaffRecipient = useChatStore((s) => s.selectStaffRecipient);

  const { data: chatListResponse, isLoading } = useQuery({
    queryKey: ["chat-list"],
    queryFn: fetchChatList,
  });

  useSocketEvent("message:new", () => {
    queryClient.invalidateQueries({ queryKey: ["chat-list"] });
  });

  // active conversation/staff ka display info nikalo already-fetched data se
  const activeConversation = chatListResponse?.conversations.find(
    (c) => c._id === activeConversationId,
  );
  const activeStaff = chatListResponse?.staffWithoutConversation.find(
    (s) => s._id === pendingRecipientId,
  );

  const getConversationDisplayName = () => {
    if (!activeConversation) return "";
    if (activeConversation.type === "group")
      return activeConversation.groupName || "Group chat";
    return activeConversation.members[0]?.name || "Direct chat";
  };

  return (
    <div className="flex h-full overflow-hidden">
      <ConversationList
        data={chatListResponse}
        isLoading={isLoading}
        activeConversationId={activeConversationId}
        activeRecipientId={pendingRecipientId}
        onSelectConversation={selectConversation}
        onSelectStaff={selectStaffRecipient}
      />

      <main className="flex flex-1 flex-col bg-background">
        {activeConversationId && activeConversation ? (
          <ChatWindow
            conversationId={activeConversationId}
            recipientId={null}
            displayName={getConversationDisplayName()}
            avatarUrl={
              activeConversation.groupAvatarUrl ||
              activeConversation.members[0]?.avatarUrl
            }
            isOnline={activeConversation.members[0]?.isOnline}
          />
        ) : pendingRecipientId && activeStaff ? (
          <ChatWindow
            conversationId={null}
            recipientId={pendingRecipientId}
            displayName={activeStaff.name}
            avatarUrl={activeStaff.avatarUrl}
            isOnline={activeStaff.isOnline}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <MessageSquareText className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Select a conversation
              </p>
              <p className="text-xs text-muted-foreground">
                Choose a chat from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ChatPage;

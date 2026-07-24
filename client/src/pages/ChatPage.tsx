// src/pages/ChatPage.tsx
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareText } from "lucide-react";
import { useSocketEvent } from "@/hooks/useSocket";
import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import { fetchChatList } from "@/api/conversation.api";
import { useChatStore } from "@/store/chatStore";
import React from "react";
import CreateGroupDialog from "@/components/chat/CreateGroupDialog";
import { useUIStore } from "@/store/uiStore";
import ConversationInfoPanel from "@/components/chat/ConversationInfoPanel";
import type { Conversation } from "@/types/conversation.types";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const ChatPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isGroupDialogOpen, setIsGroupDialogOpen] = React.useState(false);

  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const pendingRecipientId = useChatStore((s) => s.pendingRecipientId);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const selectStaffRecipient = useChatStore((s) => s.selectStaffRecipient);
  const clearActiveChat = useChatStore((s) => s.clearActiveChat);

  const isInfoPanelOpen = useUIStore((s) => s.isInfoPanelOpen);

  const { requestPermissionAndSubscribe } = usePushNotifications();

  React.useEffect(() => {
    if (Notification.permission === "default") {
      requestPermissionAndSubscribe();
    }
  }, [requestPermissionAndSubscribe]);

  const { data: chatListResponse, isLoading } = useQuery({
    queryKey: ["chat-list"],
    queryFn: fetchChatList,
  });

  useSocketEvent("message:new", () => {
    queryClient.invalidateQueries({ queryKey: ["chat-list"] });
  });

  useSocketEvent("conversation:new", (conv: Conversation) => {
    console.log({ newConversation: conv });
    queryClient.invalidateQueries({ queryKey: ["chat-list"] });
  });

  useSocketEvent<{ conversationId: string; members: any[] }>(
    "conversation:membersAdded",
    () => {
      queryClient.invalidateQueries({ queryKey: ["chat-list"] });
    },
  );
  useSocketEvent<{ conversationId: string; members: any[] }>(
    "conversation:membersRemoved",
    () => {
      queryClient.invalidateQueries({ queryKey: ["chat-list"] });
    },
  );

  useSocketEvent("conversation:memberLeft", () => {
    queryClient.invalidateQueries({ queryKey: ["chat-list"] });
  });

  useSocketEvent("conversation:updated", () => {
    queryClient.invalidateQueries({ queryKey: ["chat-list"] });
  });

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

    const otherMember = activeConversation.members.filter(
      (m) => m._id !== user?.id,
    )[0];
    return otherMember?.name || "Direct chat";
  };

  const getIsOnline = () => {
    if (!activeConversation) return false;
    if (activeConversation.type === "group") return false;

    const otherMember = activeConversation.members.filter(
      (m) => m._id !== user?.id,
    )[0];
    return otherMember?.isOnline || false;
  };

  // naya - mobile pe kaunsa panel dikhana hai decide karne ke liye
  const isChatOpen = !!(activeConversationId || pendingRecipientId);

  const onStartDirectChat = (userId: string) => {
    const findConv = chatListResponse?.conversations.find(
      (c) => c.type === "direct" && c.members.some((m) => m._id === userId),
    );
    if (findConv) {
      selectConversation(findConv);
    } else {
      selectStaffRecipient(userId);
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Conversation List:
          mobile -> full width jab koi chat khuli na ho, hidden jab chat khuli ho
          desktop (md+) -> hamesha visible, fixed 320px width */}
      <div
        className={cn(
          "w-full shrink-0 md:flex md:w-80",
          isChatOpen ? "hidden md:flex" : "flex",
        )}
      >
        <ConversationList
          data={chatListResponse}
          isLoading={isLoading}
          activeConversationId={activeConversationId}
          activeRecipientId={pendingRecipientId}
          onSelectConversation={selectConversation}
          onSelectStaff={selectStaffRecipient}
          onCreateGroup={() => setIsGroupDialogOpen(true)}
        />
      </div>

      {/* Main chat area:
          mobile -> full width jab chat khuli ho, hidden jab list dikh rahi ho
          desktop (md+) -> hamesha visible, remaining space leta hai */}
      <main
        className={cn(
          "min-w-0 flex-1 flex-col bg-background md:flex",
          isChatOpen ? "flex" : "hidden md:flex",
        )}
      >
        {activeConversationId && activeConversation ? (
          <ChatWindow
            conversationId={activeConversationId}
            recipientId={null}
            displayName={getConversationDisplayName()}
            avatarUrl={
              activeConversation.groupAvatarUrl ||
              activeConversation.members[0]?.avatarUrl
            }
            isOnline={getIsOnline()}
            conversationType={activeConversation.type}
            onlineCount={
              activeConversation.members.filter((m) => m.isOnline).length
            }
            onBack={clearActiveChat}
          />
        ) : pendingRecipientId && activeStaff ? (
          <ChatWindow
            conversationId={null}
            recipientId={pendingRecipientId}
            displayName={activeStaff.name}
            avatarUrl={activeStaff.avatarUrl}
            isOnline={activeStaff.isOnline}
            onBack={clearActiveChat}
          />
        ) : (
          <div className="hidden flex-1 flex-col items-center justify-center gap-3 text-center md:flex">
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

      {/* Info panel:
          mobile -> jab open ho, poori screen le le (list/chat dono ko replace kare)
          desktop (md+) -> normal sibling panel, right side */}
      {isInfoPanelOpen && activeConversation && (
        <div className="fixed inset-0 z-[60] bg-background md:static md:z-auto md:bg-transparent">
          <ConversationInfoPanel
            type={activeConversation.type}
            displayName={getConversationDisplayName()}
            avatarUrl={
              activeConversation.groupAvatarUrl ||
              activeConversation.members[0]?.avatarUrl
            }
            isOnline={activeConversation.members[0]?.isOnline}
            role={activeConversation.members[0]?.role}
            members={activeConversation.members}
            adminIds={activeConversation?.admins || []}
            conversationId={activeConversation._id}
            onStartDirectChat={onStartDirectChat}
          />
        </div>
      )}

      <CreateGroupDialog
        open={isGroupDialogOpen}
        onOpenChange={setIsGroupDialogOpen}
        onGroupCreated={(_conversationId) => {
          queryClient.invalidateQueries({ queryKey: ["chat-list"] });
        }}
      />
    </div>
  );
};

export default ChatPage;

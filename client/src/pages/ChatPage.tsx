// src/pages/ChatPage.tsx
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, MessageSquareText, ShieldAlert } from "lucide-react";
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
import usePermissions from "@/hooks/usePermissions";
import { MODULES } from "@/lib/constants";
import PageLoader from "@/components/common/PageLoader";
import { PageTitle } from "@/components/common/PageTitle";
import { useNavigate, useParams } from "react-router-dom";

const ChatPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { chatId } = useParams();
  const queryClient = useQueryClient();

  const [isGroupDialogOpen, setIsGroupDialogOpen] = React.useState(false);

  const activeConversationId =
    useChatStore((s) => s.activeConversationId) || chatId;
  const pendingRecipientId = useChatStore((s) => s.pendingRecipientId);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const selectStaffRecipient = useChatStore((s) => s.selectStaffRecipient);
  const clearActiveChat = useChatStore((s) => s.clearActiveChat);

  const isInfoPanelOpen = useUIStore((s) => s.isInfoPanelOpen);

  const { requestPermissionAndSubscribe } = usePushNotifications();

  const { isLoading: permissionsLoading, permissions } = usePermissions({
    module: MODULES.CLINIC_ZEVA_CONNECT,
    subModule: MODULES.SUBMODULES.TEAM_CHAT,
  });

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
    selectConversation(conv);
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

  if (permissionsLoading) {
    return (
      <>
        {/* Page Title */}
        <PageTitle title="Chats" />
        <PageLoader />
      </>
    );
  }

  if (!permissions?.permission?.read) {
    return (
      <>
        {/* Page Title */}
        <PageTitle title="Chats" />

        <div className="flex h-full flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 animate-pulse rounded-full bg-destructive/10" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/15">
              <Lock className="h-7 w-7 text-destructive" strokeWidth={1.75} />
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-base font-semibold tracking-tight text-foreground">
              Access restricted
            </p>
            <p className="max-w-[280px] text-sm text-muted-foreground">
              You don't have permission to view this page. Reach out to your
              clinic admin if you think this is a mistake.
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
            <ShieldAlert className="h-3 w-3" />
            <span>Permission required: Read access</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Conversation List:
          mobile -> full width jab koi chat khuli na ho, hidden jab chat khuli ho
          desktop (md+) -> hamesha visible, fixed 320px width */}

      {/* Page Title */}
      <PageTitle title="Chats" />

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
          onSelectConversation={(conv) => {
            selectConversation(conv);
            navigate(`/chat/${conv._id}`);
          }}
          onSelectStaff={(staffId) => {
            selectStaffRecipient(staffId);
            navigate(`/chat`);
          }}
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

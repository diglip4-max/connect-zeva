import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Conversation } from "@/types/conversation.types";
import { formatConversationTime, getInitials } from "@/lib/formatDate";
import { useAuth } from "@/context/AuthContext";

interface ConversationListItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (conversation: Conversation) => void;
}

const ConversationListItem = ({
  conversation,
  isActive,
  onSelect,
}: ConversationListItemProps) => {
  const { user } = useAuth();
  const recipient = conversation.members.find(
    (member) => member._id !== user?.id,
  );
  const isDirect = conversation.type === "direct";
  const displayName =
    conversation.groupName || recipient?.name || "Direct chat";
  const avatarUrl = conversation.groupAvatarUrl || recipient?.avatarUrl;

  return (
    <button
      onClick={() => onSelect(conversation)}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 ${
        isActive ? "bg-primary/5" : ""
      }`}
    >
      <div className="relative">
        <Avatar className="h-11 w-11 shrink-0">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        {recipient?.isOnline && isDirect && (
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">{displayName}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatConversationTime(conversation.lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-muted-foreground">
            {conversation?.lastMessage?.text
              ? conversation?.lastMessage?.text
              : "No messages yet"}
          </span>
          {!!conversation.unreadCount && (
            <span className="flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default ConversationListItem;

// src/components/chat/ConversationList.tsx
import { useState } from "react";
import { SquarePen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Conversation, UnifiedChatList } from "@/types/conversation.types";
import ConversationListItem from "./ConversationListItem";
import StaffListItem from "./StaffListItem";
import ConversationSkeleton from "./ConversationSkeleton";
import ConversationEmptyState from "./ConversationEmptyState";
import { useChatStore } from "@/store/chatStore";

interface ConversationListProps {
  data: UnifiedChatList | undefined;
  isLoading: boolean;
  activeConversationId: string | null;
  activeRecipientId: string | null;
  onSelectConversation: (conversation: Conversation) => void;
  onSelectStaff: (userId: string) => void;
  onCreateGroup: () => void;
}

const ConversationList = ({
  data,
  isLoading,
  activeConversationId,
  activeRecipientId,
  onSelectConversation,
  onSelectStaff,
  onCreateGroup,
}: ConversationListProps) => {
  const { permissions } = useChatStore();
  const [search, setSearch] = useState("");

  const filteredConversations = data?.conversations.filter((c) => {
    const displayName =
      c.type === "group"
        ? c.groupName || "Group chat"
        : c.members.find((m) => m.name)?.name || "Direct chat";
    return displayName.toLowerCase().includes(search.toLowerCase());
  });

  const filteredStaff = data?.staffWithoutConversation.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const hasConversations =
    filteredConversations && filteredConversations.length > 0;
  const hasStaff = filteredStaff && filteredStaff.length > 0;
  const isEmpty = !hasConversations && !hasStaff;

  return (
    <aside className="flex w-full shrink-0 flex-col border-r border-border/60 bg-card/30">
      <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-4">
        <h2 className="text-base font-semibold tracking-tight">Chats</h2>

        {/* Create group button if user has create group permission */}
        {permissions?.permission.create && (
          <Button
            variant="ghost"
            size="icon"
            title="New group"
            onClick={onCreateGroup}
            className={"rounded-sm"}
          >
            <SquarePen className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 bg-background pl-9 text-sm"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 overflow-auto">
        {isLoading ? (
          <div className="divide-y divide-border/40">
            {Array.from({ length: 6 }).map((_, i) => (
              <ConversationSkeleton key={i} />
            ))}
          </div>
        ) : isEmpty ? (
          <ConversationEmptyState />
        ) : (
          <>
            {hasConversations && (
              <div className="divide-y divide-border/40">
                {filteredConversations!.map((c) => (
                  <ConversationListItem
                    key={c._id}
                    conversation={c}
                    isActive={activeConversationId === c._id}
                    onSelect={onSelectConversation}
                  />
                ))}
              </div>
            )}

            {hasStaff && (
              <div>
                <p className="px-4 pb-1 pt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Start a conversation
                </p>
                <div className="divide-y divide-border/40">
                  {filteredStaff!.map((staff) => (
                    <StaffListItem
                      key={staff._id}
                      staff={staff}
                      isActive={activeRecipientId === staff._id}
                      onSelect={onSelectStaff}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </ScrollArea>
    </aside>
  );
};

export default ConversationList;

// src/components/chat/PinnedMessagesBar.tsx
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pin, PinOff, X, ChevronDown } from "lucide-react";
import axiosClient from "@/api/axiosClient";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/store/chatStore";
import { useAuth } from "@/context/AuthContext";
import { useSocketEvent } from "@/hooks/useSocket";

interface PinnedMessage {
  _id: string;
  text?: string;
  senderId?: { name: string };
  pinnedAt?: string;
}

interface PinnedMessagesBarProps {
  conversationId: string;
}

const PinnedMessagesBar = ({ conversationId }: PinnedMessagesBarProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const selectedConversation = useChatStore(
    (state) => state.selectedConversation,
  );

  const isGroupType = selectedConversation?.type === "group";
  const isCurrentUserAdmin =
    selectedConversation?.admins?.includes(user?.id || "") ?? false;
  const canUnpin = isGroupType ? isCurrentUserAdmin : true;

  useSocketEvent<{ messageId: string; isPinned: boolean }>(
    "message:pinned",
    (_data) => {
      queryClient.invalidateQueries({
        queryKey: ["pinned-messages", conversationId],
      });
    },
  );

  const { data: pinnedMessages } = useQuery({
    queryKey: ["pinned-messages", conversationId],
    queryFn: async () => {
      const { data } = await axiosClient.get(
        `/messages/${conversationId}/pinned`,
      );
      return data.data as PinnedMessage[];
    },
  });

  const handleUnpin = async (messageId: string) => {
    try {
      await axiosClient.post(`/messages/${messageId}/pin`);
      queryClient.invalidateQueries({
        queryKey: ["pinned-messages", conversationId],
      });
      toast.success("Message unpinned");
    } catch {
      toast.error("Failed to unpin message");
    }
  };

  if (!pinnedMessages || pinnedMessages.length === 0) return null;

  const latestPinned = pinnedMessages[0];

  return (
    <div className="flex items-center gap-2 border-b border-border/60 bg-primary/5 px-4 py-2">
      <Pin className="h-3.5 w-3.5 shrink-0 text-primary" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-foreground">
          <span className="font-medium">{latestPinned.senderId?.name}: </span>
          {latestPinned.text || "Attachment"}
        </p>
      </div>

      {pinnedMessages.length > 1 && (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger>
            <button className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground">
              +{pinnedMessages.length - 1} more
              <ChevronDown className="h-3 w-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-2">
            <p className="mb-1.5 px-1 text-xs font-medium text-muted-foreground">
              {pinnedMessages.length} Pinned Messages
            </p>
            <ScrollArea className="max-h-60">
              <div className="space-y-0.5">
                {pinnedMessages.map((msg) => (
                  <div
                    key={msg._id}
                    className="group flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium">
                        {msg.senderId?.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {msg.text || "Attachment"}
                      </p>
                    </div>
                    {canUnpin && (
                      <button
                        onClick={() => handleUnpin(msg._id)}
                        className="shrink-0 rounded-full p-1 opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100"
                        title="Unpin"
                      >
                        <PinOff className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      )}

      {canUnpin && (
        <button
          onClick={() => handleUnpin(latestPinned._id)}
          className="shrink-0 rounded-full p-1 hover:bg-muted"
          title="Unpin this message"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
};

export default PinnedMessagesBar;

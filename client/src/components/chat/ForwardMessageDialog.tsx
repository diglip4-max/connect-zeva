// src/components/chat/ForwardMessageDialog.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/formatDate";
import { fetchChatList } from "@/api/conversation.api";
import { forwardMessage } from "@/api/message.api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface ForwardMessageDialogProps {
  messageId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ForwardMessageDialog = ({
  messageId,
  open,
  onOpenChange,
}: ForwardMessageDialogProps) => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isForwarding, setIsForwarding] = useState(false);

  const { data: chatList } = useQuery({
    queryKey: ["chat-list"],
    queryFn: fetchChatList,
    enabled: open,
  });

  const conversations = chatList?.conversations.filter((c) => {
    const name =
      c.type === "group"
        ? c.groupName || "Group"
        : c.members[0]?.name || "Direct chat";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleForward = async () => {
    if (!messageId || selectedIds.length === 0) return;
    setIsForwarding(true);
    try {
      await forwardMessage(messageId, selectedIds);
      toast.success("Message forwarded");
      setSelectedIds([]);
      onOpenChange(false);
    } catch {
      toast.error("Failed to forward message");
    } finally {
      setIsForwarding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm z-[200]">
        <DialogHeader>
          <DialogTitle>Forward message</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-72 -mx-1">
          <div className="space-y-0.5 px-1">
            {conversations?.map((c) => {
              let otherMember = null;
              if (c.type === "direct") {
                otherMember = c.members.find((m) => m._id !== user?.id);
              }
              const name =
                c.type === "group"
                  ? c.groupName || "Group"
                  : otherMember?.name || "Direct chat";
              const avatarUrl =
                c.type === "group" ? c.groupAvatarUrl : otherMember?.avatarUrl;
              const isSelected = selectedIds.includes(c._id);
              return (
                <button
                  key={c._id}
                  onClick={() => toggleSelect(c._id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted",
                    isSelected && "bg-primary/5",
                  )}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="bg-primary/10 text-xs text-primary">
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 truncate text-sm font-medium">
                    {name}
                  </span>
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border-2",
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-border",
                    )}
                  >
                    {isSelected && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            onClick={handleForward}
            disabled={selectedIds.length === 0 || isForwarding}
            className="w-full"
          >
            {isForwarding
              ? "Forwarding..."
              : `Forward to ${selectedIds.length || ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ForwardMessageDialog;

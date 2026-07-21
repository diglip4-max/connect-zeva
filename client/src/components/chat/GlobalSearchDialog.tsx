import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/formatDate";
import axiosClient from "@/api/axiosClient";
import { useChatStore } from "@/store/chatStore";

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GlobalSearchDialog = ({
  open,
  onOpenChange,
}: GlobalSearchDialogProps) => {
  const [query, setQuery] = useState("");
  const selectStaffRecipient = useChatStore((s) => s.selectStaffRecipient);

  const { data } = useQuery({
    queryKey: ["global-search", query],
    queryFn: async () => {
      const [peopleRes, messagesRes] = await Promise.all([
        axiosClient.get(`/conversations/search/global?q=${query}`),
        axiosClient.get(`/messages/search/all?q=${query}`),
      ]);
      return { ...peopleRes.data.data, messages: messagesRes.data.data };
    },
    enabled: query.length > 1,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search messages, chats, people..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        <ScrollArea className="h-80">
          {/* Conversations */}
          {/* {data?.conversations?.length > 0 && (
            <div className="mb-3">
              <p className="mb-1 px-1 text-xs font-medium uppercase text-muted-foreground">
                Conversations
              </p>
              {data.conversations.map((p: any) => (
                <button
                  key={p._id}
                  onClick={() => {
                    // selectStaffRecipient(p._id);
                    // onOpenChange(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-muted"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={p.avatarUrl} />
                    <AvatarFallback>{getInitials(p.name)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{p.name}</span>
                </button>
              ))}
            </div>
          )} */}
          {data?.people?.length > 0 && (
            <div className="mb-3">
              <p className="mb-1 px-1 text-xs font-medium uppercase text-muted-foreground">
                People
              </p>
              {data.people.map((p: any) => (
                <button
                  key={p._id}
                  onClick={() => {
                    selectStaffRecipient(p._id);
                    onOpenChange(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-muted"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={p.avatarUrl} />
                    <AvatarFallback>{getInitials(p.name)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{p.name}</span>
                </button>
              ))}
            </div>
          )}

          {data?.messages?.length > 0 && (
            <div>
              <p className="mb-1 px-1 text-xs font-medium uppercase text-muted-foreground">
                Messages
              </p>
              {data.messages.map((m: any) => (
                <div
                  key={m._id}
                  className="rounded-lg px-2 py-2 cursor-pointer hover:bg-muted"
                >
                  <p className="text-xs font-medium">{m.senderId?.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {m.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearchDialog;

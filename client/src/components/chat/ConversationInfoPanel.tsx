// src/components/chat/ConversationInfoPanel.tsx
import { X, Crown, ArrowLeft, Link2, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUIStore } from "@/store/uiStore";
import { getInitials } from "@/lib/formatDate";
import type { ConversationMember } from "@/types/conversation.types";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchSharedLinks } from "@/api/message.api";
import React from "react";
import MemberProfileDialog from "./MemberProfileDialog";
import AddMembersDialog from "./AddMembersDialog";

interface ConversationInfoPanelProps {
  type: "direct" | "group";
  displayName: string;
  avatarUrl?: string;
  isOnline?: boolean;
  role?: string;
  conversationId?: string;
  members?: ConversationMember[];
  adminIds?: string[];
  onStartDirectChat?: (userId: string) => void;
}

const ConversationInfoPanel = ({
  type,
  displayName,
  avatarUrl,
  isOnline,
  role,
  conversationId,
  members = [],
  adminIds = [],
  onStartDirectChat,
}: ConversationInfoPanelProps) => {
  const { user } = useAuth();
  const closeInfoPanel = useUIStore((s) => s.closeInfoPanel);

  const [selectedMember, setSelectedMember] =
    React.useState<ConversationMember | null>(null);

  const currentUserIsAdmin = adminIds.includes(user?.id || "");

  const [isAddMembersOpen, setIsAddMembersOpen] = React.useState(false);

  const { data: sharedLinks, isLoading: linksLoading } = useQuery({
    queryKey: ["shared-links", conversationId],
    queryFn: () => fetchSharedLinks(conversationId!),
    enabled: !!conversationId && type === "direct", // sirf direct chat me Links tab hai abhi
  });

  const onlineCount = members.filter((m) => m.isOnline).length;

  return (
    <aside className="flex h-full w-full flex-col border-l border-border/60 bg-background md:w-80 md:shrink-0 md:bg-card/30">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3.5">
        {/* Mobile: back arrow (poore-screen overlay se wapas jaane ke liye) */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            onClick={closeInfoPanel}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-sm font-semibold tracking-tight">
            {type === "group" ? "Group info" : "Contact info"}
          </h2>
        </div>

        {/* Desktop: close (X) button */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden rounded-sm md:flex"
          onClick={closeInfoPanel}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-xl font-medium text-primary">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>

          <div>
            <p className="text-base font-semibold tracking-tight">
              {displayName}
            </p>
            {type === "direct" ? (
              <p className="mt-0.5 text-sm capitalize text-muted-foreground">
                {role} · {isOnline ? "Online" : "Offline"}
              </p>
            ) : (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {members.length} members, {onlineCount} online
              </p>
            )}
          </div>
        </div>

        {type === "group" ? (
          <div className="px-4 pb-6">
            <div className="flex items-center justify-between pb-2">
              <p className="pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {members.length} Members
              </p>
              {currentUserIsAdmin && conversationId && (
                <button
                  onClick={() => setIsAddMembersOpen(true)}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Add
                </button>
              )}
            </div>
            <div className="space-y-0.5">
              {members.map((member) => {
                const isAdmin = adminIds.includes(member._id);
                return (
                  <div
                    key={member._id}
                    onClick={() => setSelectedMember(member)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted/60"
                  >
                    <div className="relative">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.avatarUrl} alt={member.name} />
                        <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">
                          {getInitials(
                            user?.id === member._id ? "You" : member.name,
                          )}
                        </AvatarFallback>
                      </Avatar>
                      {member.isOnline && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-medium">
                          {user?.id === member._id ? "You" : member.name}
                        </p>
                        {isAdmin && (
                          <Crown className="h-3 w-3 shrink-0 text-amber-500" />
                        )}
                      </div>
                      <p className="truncate text-xs capitalize text-muted-foreground">
                        {member.role}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="border-t border-border/60">
            <Tabs defaultValue="media" className="w-full">
              <TabsList className="h-11 w-full justify-start rounded-none border-b border-border/60 bg-transparent px-4">
                <TabsTrigger
                  value="media"
                  className="rounded-none border-b-2 border-transparent px-3 text-xs text-muted-foreground data-selected:border-primary data-selected:text-primary data-selected:shadow-none"
                >
                  Media
                </TabsTrigger>
                <TabsTrigger
                  value="files"
                  className="rounded-none border-b-2 border-transparent px-3 text-xs text-muted-foreground data-selected:border-primary data-selected:text-primary data-selected:shadow-none"
                >
                  Files
                </TabsTrigger>
                <TabsTrigger
                  value="links"
                  className="rounded-none border-b-2 border-transparent px-3 text-xs text-muted-foreground data-selected:border-primary data-selected:text-primary data-selected:shadow-none"
                >
                  Links
                </TabsTrigger>
              </TabsList>
              <TabsContent
                value="media"
                className="px-4 py-8 text-center text-sm text-muted-foreground"
              >
                No shared media yet
              </TabsContent>
              <TabsContent
                value="files"
                className="px-4 py-8 text-center text-sm text-muted-foreground"
              >
                No shared files yet
              </TabsContent>
              <TabsContent value="links" className="px-4 py-4">
                {linksLoading ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Loading...
                  </p>
                ) : sharedLinks && sharedLinks.length > 0 ? (
                  <div className="space-y-2">
                    {sharedLinks.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-border/60 p-2.5 text-xs transition-colors hover:bg-muted/60"
                      >
                        <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate text-primary">
                          {link.url}
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No shared links yet
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </ScrollArea>

      {/* Member Profile Dialog */}
      {conversationId && (
        <MemberProfileDialog
          open={!!selectedMember}
          onOpenChange={(open) => !open && setSelectedMember(null)}
          member={selectedMember}
          conversationId={conversationId}
          isMemberAdmin={
            selectedMember ? adminIds.includes(selectedMember._id) : false
          }
          isCurrentUserAdmin={currentUserIsAdmin}
          isSelf={selectedMember?._id === user?.id}
          onStartDirectChat={onStartDirectChat}
        />
      )}

      {/* Add Members Dialog */}
      {conversationId && (
        <AddMembersDialog
          open={isAddMembersOpen}
          onOpenChange={setIsAddMembersOpen}
          conversationId={conversationId}
          existingMemberIds={members.map((m) => m._id)}
        />
      )}
    </aside>
  );
};

export default ConversationInfoPanel;

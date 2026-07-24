// src/components/chat/ConversationInfoPanel.tsx
import { useState } from "react";
import {
  X,
  Crown,
  ArrowLeft,
  Link2,
  UserPlus,
  FileText,
  Download,
  Pencil,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getInitials } from "@/lib/formatDate";
import type { ConversationMember } from "@/types/conversation.types";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
  fetchSharedLinks,
  fetchSharedMedia,
  fetchSharedFiles,
} from "@/api/message.api";
import MemberProfileDialog from "./MemberProfileDialog";
import AddMembersDialog from "./AddMembersDialog";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";
import { useSocketEvent } from "@/hooks/useSocket";
import EditGroupDialog from "./EditGroupDialog";
import LeaveGroupDialog from "./LeaveGroupDialog";

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

type TabKey = "info" | "media" | "files" | "links";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  const openViewer = useUIStore((s) => s.openViewer);

  const [activeTab, setActiveTab] = useState<TabKey>("info");
  const [selectedMember, setSelectedMember] =
    useState<ConversationMember | null>(null);
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);

  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);
  const [isLeaveGroupOpen, setIsLeaveGroupOpen] = useState(false);

  const currentUserIsAdmin = adminIds.includes(user?.id || "");
  const onlineCount = members.filter((m) => m.isOnline).length;

  const { data: sharedLinks, isLoading: linksLoading } = useQuery({
    queryKey: ["shared-links", conversationId],
    queryFn: () => fetchSharedLinks(conversationId!),
    enabled: !!conversationId && activeTab === "links",
  });

  const { data: sharedMedia, isLoading: mediaLoading } = useQuery({
    queryKey: ["shared-media", conversationId],
    queryFn: () => fetchSharedMedia(conversationId!),
    enabled: !!conversationId && activeTab === "media",
  });

  const { data: sharedFiles, isLoading: filesLoading } = useQuery({
    queryKey: ["shared-files", conversationId],
    queryFn: () => fetchSharedFiles(conversationId!),
    enabled: !!conversationId && activeTab === "files",
  });

  const tabs: { key: TabKey; label: string }[] = [
    { key: "info", label: type === "group" ? "Members" : "Info" },
    { key: "media", label: "Media" },
    { key: "files", label: "Files" },
    { key: "links", label: "Links" },
  ];

  // naya socket listener - group update turant reflect ho
  useSocketEvent<{ conversationId: string }>("conversation:updated", (data) => {
    if (data.conversationId === conversationId) {
      // chat-list invalidate karo taaki naam/avatar turant refresh ho
      // (queryClient ChatPage se already invalidate ho raha hoga "conversation:new" jaisa pattern se)
    }
  });

  return (
    <aside className="flex h-full w-full flex-col border-l border-border/60 bg-background md:w-80 md:shrink-0 md:bg-card/30">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3.5">
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
        {/* Profile header - hamesha visible */}
        <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
          <Avatar className="h-20 w-20 relative">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-xl font-medium text-primary">
              {getInitials(displayName)}
            </AvatarFallback>
            {type === "group" && currentUserIsAdmin && (
              <button
                onClick={() => setIsEditGroupOpen(true)}
                className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
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

        {/* Tab bar - dono types ke liye, members-list se pehle */}
        <div className="sticky top-0 z-10 flex border-b border-border/60 bg-background/95 px-4 backdrop-blur-sm">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 border-b-2 px-2 py-2.5 text-xs font-medium transition-colors",
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "info" && (
          <div className="px-4 py-4">
            {type === "group" ? (
              <>
                <div className="flex items-center justify-between pb-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
                            <AvatarImage
                              src={member.avatarUrl}
                              alt={member.name}
                            />
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
              </>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Shared media, files, and links appear in the tabs above.
              </p>
            )}
          </div>
        )}

        {activeTab === "media" && (
          <div className="p-4">
            {mediaLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Loading...
              </p>
            ) : sharedMedia && sharedMedia.length > 0 ? (
              <div className="grid grid-cols-3 gap-1">
                {sharedMedia.map((item, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      openViewer(
                        { ...item, fileSize: item.fileSize || 0, mimeType: "" },
                        sharedMedia.map((m) => ({
                          ...m,
                          fileSize: m.fileSize || 0,
                          mimeType: "",
                        })),
                      )
                    }
                    className="relative aspect-square overflow-hidden rounded-md bg-muted"
                  >
                    {item.type === "image" ? (
                      <img
                        src={item.url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <video
                        src={item.url}
                        className="h-full w-full object-cover"
                        muted
                      />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No shared media yet
              </p>
            )}
          </div>
        )}

        {activeTab === "files" && (
          <div className="space-y-2 p-4">
            {filesLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Loading...
              </p>
            ) : sharedFiles && sharedFiles.length > 0 ? (
              sharedFiles.map((item, i) => (
                <a
                  key={i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-lg border border-border/60 p-2.5 transition-colors hover:bg-muted/60"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">
                      {item.fileName}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatFileSize(item.fileSize)}
                    </p>
                  </div>
                  <Download className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </a>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No shared files yet
              </p>
            )}
          </div>
        )}

        {activeTab === "links" && (
          <div className="space-y-2 p-4">
            {linksLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Loading...
              </p>
            ) : sharedLinks && sharedLinks.length > 0 ? (
              sharedLinks.map((link, i) => (
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
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No shared links yet
              </p>
            )}
          </div>
        )}
      </ScrollArea>
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
      {conversationId && (
        <AddMembersDialog
          open={isAddMembersOpen}
          onOpenChange={setIsAddMembersOpen}
          conversationId={conversationId}
          existingMemberIds={members.map((m) => m._id)}
        />
      )}
      {conversationId && type === "group" && (
        <>
          <EditGroupDialog
            open={isEditGroupOpen}
            onOpenChange={setIsEditGroupOpen}
            conversationId={conversationId}
            currentName={displayName}
            currentAvatarUrl={avatarUrl}
          />
          <LeaveGroupDialog
            open={isLeaveGroupOpen}
            onOpenChange={setIsLeaveGroupOpen}
            conversationId={conversationId}
            groupName={displayName}
          />
        </>
      )}
    </aside>
  );
};

export default ConversationInfoPanel;

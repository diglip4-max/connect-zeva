// src/components/chat/MemberProfileDialog.tsx
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Crown,
  ShieldMinus,
  UserMinus,
  MessageSquare,
  Phone,
  Video,
  Info,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/formatDate";
import {
  makeGroupAdmin,
  removeGroupAdmin,
  removeGroupMember,
} from "@/api/conversation.api";
import type { ConversationMember } from "@/types/conversation.types";
import { cn } from "@/lib/utils";

interface MemberProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: ConversationMember | null;
  conversationId: string;
  isMemberAdmin: boolean;
  isCurrentUserAdmin: boolean;
  isSelf: boolean;
  onStartDirectChat?: (userId: string) => void;
}

const MemberProfileDialog = ({
  open,
  onOpenChange,
  member,
  conversationId,
  isMemberAdmin,
  isCurrentUserAdmin,
  isSelf,
  onStartDirectChat,
}: MemberProfileDialogProps) => {
  const queryClient = useQueryClient();
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!member) return null;

  const invalidateChatList = () => {
    queryClient.invalidateQueries({ queryKey: ["chat-list"] });
  };

  const handleMakeAdmin = async () => {
    setIsProcessing(true);
    try {
      await makeGroupAdmin(conversationId, member._id);
      invalidateChatList();
      onOpenChange(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveAdmin = async () => {
    setIsProcessing(true);
    try {
      await removeGroupAdmin(conversationId, member._id);
      invalidateChatList();
      onOpenChange(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveMember = async () => {
    setIsProcessing(true);
    try {
      await removeGroupMember(conversationId, member._id);
      invalidateChatList();
      setShowRemoveConfirm(false);
      onOpenChange(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="md:max-w-screen-sm overflow-hidden p-0 sm:max-w-sm">
          {/* Cover/gradient header */}
          <div className="flex flex-col items-center gap-3 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent px-6 pb-6 pt-10">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-4 ring-background">
                <AvatarImage src={member.avatarUrl} alt={member.name} />
                <AvatarFallback className="bg-primary/10 text-2xl font-medium text-primary">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              {member.isOnline && (
                <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 ring-4 ring-background" />
              )}
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5">
                <p className="text-lg font-semibold tracking-tight">
                  {isSelf ? "You" : member.name}
                </p>
                {isMemberAdmin && (
                  <Crown className="h-4 w-4 shrink-0 text-amber-500" />
                )}
              </div>
              <p className="mt-0.5 text-sm capitalize text-muted-foreground">
                {member.role}
              </p>
              <p
                className={cn(
                  "mt-1 inline-flex items-center gap-1.5 text-xs",
                  member.isOnline
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    member.isOnline ? "bg-emerald-500" : "bg-muted-foreground",
                  )}
                />
                {member.isOnline ? "Online" : "Offline"}
              </p>
            </div>

            {/* Quick action icons - WhatsApp jaisa row */}
            {!isSelf && (
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => {
                    onStartDirectChat?.(member._id);
                    onOpenChange(false);
                  }}
                  className="flex flex-col items-center gap-1.5 rounded-xl px-4 py-2.5 transition-colors hover:bg-muted/60"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Message
                  </span>
                </button>

                <button
                  disabled
                  className="flex flex-col items-center gap-1.5 rounded-xl px-4 py-2.5 opacity-40"
                  title="Coming soon"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Phone className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Call
                  </span>
                </button>

                <button
                  disabled
                  className="flex flex-col items-center gap-1.5 rounded-xl px-4 py-2.5 opacity-40"
                  title="Coming soon"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Video className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Video
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Info section */}
          <div className="space-y-3 border-t border-border/60 px-4 py-3">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm">
                  {isSelf ? "You" : member.name} is a{" "}
                  <span className="capitalize">{member.role}</span> at this
                  clinic.
                </p>
                {isMemberAdmin && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Group admin — can manage members and settings
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Admin actions */}
          {isCurrentUserAdmin && !isSelf && (
            <div className="flex flex-col gap-0.5 border-t border-border/60 p-2">
              {isMemberAdmin ? (
                <Button
                  variant="ghost"
                  className="justify-start gap-3 px-3"
                  onClick={handleRemoveAdmin}
                  disabled={isProcessing}
                >
                  <ShieldMinus className="h-4 w-4 text-muted-foreground" />
                  Remove as admin
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  className="justify-start gap-3 px-3"
                  onClick={handleMakeAdmin}
                  disabled={isProcessing}
                >
                  <Crown className="h-4 w-4 text-muted-foreground" />
                  Make group admin
                </Button>
              )}

              <Button
                variant="ghost"
                className="justify-start gap-3 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setShowRemoveConfirm(true)}
                disabled={isProcessing}
              >
                <UserMinus className="h-4 w-4" />
                Remove from group
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove confirmation */}
      <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {member.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will no longer be able to see messages in this group. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MemberProfileDialog;

import { useQueryClient } from "@tanstack/react-query";
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
import { leaveGroup } from "@/api/conversation.api";
import { useChatStore } from "@/store/chatStore";
import { toast } from "sonner";

interface LeaveGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  groupName: string;
}

const LeaveGroupDialog = ({
  open,
  onOpenChange,
  conversationId,
  groupName,
}: LeaveGroupDialogProps) => {
  const queryClient = useQueryClient();
  const clearActiveChat = useChatStore((s) => s.clearActiveChat);

  const handleLeave = async () => {
    try {
      await leaveGroup(conversationId);
      queryClient.invalidateQueries({ queryKey: ["chat-list"] });
      clearActiveChat();
      onOpenChange(false);
      toast.success("You left the group");
    } catch {
      toast.error("Failed to leave group");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave "{groupName}"?</AlertDialogTitle>
          <AlertDialogDescription>
            You will no longer receive messages from this group. You can be
            added back by an admin.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLeave}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Leave group
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LeaveGroupDialog;

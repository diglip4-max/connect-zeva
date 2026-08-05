// src/components/chat/DeleteMessageModal.tsx
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Clock, Eye, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useChatStore } from "@/store/chatStore";

interface DeleteMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
}

const DeleteMessageModal = ({
  open,
  onOpenChange,
  currentUserId,
  onDeleteForMe,
  onDeleteForEveryone,
}: DeleteMessageModalProps) => {
  const selectedMessage = useChatStore((s) => s.selectedMessage);
  const selectedConversation = useChatStore((s) => s.selectedConversation);
  const isOwn = selectedMessage?.senderId?._id === currentUserId;
  const isGroup = selectedConversation?.type === "group";

  // Check if delete for everyone is allowed
  const canDeleteForEveryone = () => {
    if (!isOwn || !isGroup) return false;

    // Time limit check (5 minutes like WhatsApp)
    const timeLimit = 5 * 60 * 1000; // 5 minutes
    const timeElapsed =
      Date.now() - new Date(selectedMessage?.createdAt).getTime();
    if (timeElapsed > timeLimit) return false;

    // Check if anyone has read the message
    if (selectedMessage?.readBy && selectedMessage.readBy.length > 0) {
      return false;
    }

    return true;
  };

  const deleteForEveryoneEnabled = canDeleteForEveryone();
  const timeRemaining =
    new Date(selectedMessage?.createdAt ?? 0).getTime() +
    5 * 60 * 1000 -
    Date.now();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold">
            Delete message?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {selectedMessage?.text ? (
              <div className="mt-2 rounded-md bg-muted p-3 text-foreground">
                "
                {selectedMessage?.text.length > 50
                  ? selectedMessage?.text.slice(0, 50) + "..."
                  : selectedMessage?.text}
                "
              </div>
            ) : (
              <div className="mt-2 rounded-md bg-muted p-3 text-muted-foreground">
                [Media message]
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-4">
          {/* Delete for Everyone */}
          {isGroup && isOwn && (
            <Button
              variant={deleteForEveryoneEnabled ? "destructive" : "outline"}
              className={`w-full justify-start gap-3 h-auto py-3 px-4 ${
                !deleteForEveryoneEnabled && "opacity-60 cursor-not-allowed"
              }`}
              onClick={onDeleteForEveryone}
              disabled={!deleteForEveryoneEnabled}
            >
              <Trash2 className="h-4 w-4" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Delete for everyone</span>
                <span className="text-xs text-muted-foreground">
                  {!deleteForEveryoneEnabled ? (
                    <>
                      {selectedMessage?.readBy &&
                      selectedMessage?.readBy.length > 0 ? (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          Already seen by someone
                        </span>
                      ) : timeRemaining > 0 ? (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Available for{" "}
                          {formatDistanceToNow(
                            new Date(Date.now() + timeRemaining),
                            { includeSeconds: true },
                          )}
                        </span>
                      ) : (
                        "Time limit expired (5 minutes)"
                      )}
                    </>
                  ) : (
                    "Delete this message for all participants"
                  )}
                </span>
              </div>
            </Button>
          )}

          {/* Delete for Me */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-3 px-4"
            onClick={onDeleteForMe}
          >
            <Trash2 className="h-4 w-4" />
            <div className="flex flex-col items-start">
              <span className="font-medium">
                {isGroup ? "Delete for me" : "Delete"}
              </span>
              <span className="text-xs text-muted-foreground">
                {isGroup
                  ? "Delete this message only for yourself"
                  : "Delete this message"}
              </span>
            </div>
          </Button>
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="w-full sm:w-auto">
            Cancel
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteMessageModal;

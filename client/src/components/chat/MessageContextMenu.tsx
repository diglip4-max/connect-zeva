import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Reply,
  Forward,
  Pencil,
  Trash2,
  Copy,
  Pin,
  PinOff,
} from "lucide-react";

interface MessageContextMenuProps {
  isOwn: boolean;
  canEdit: boolean;
  isPinned?: boolean;
  canPin?: boolean; // group me sirf admin, direct chat me dono pin kar sakein
  onReply: () => void;
  onForward: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onTogglePin?: () => void;
}

const MessageContextMenu = ({
  isOwn,
  canEdit,
  isPinned,
  canPin,
  onReply,
  onForward,
  onEdit,
  onDelete,
  onCopy,
  onTogglePin,
}: MessageContextMenuProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger>
      <button className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
        <MoreVertical className="h-4 w-4" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-44">
      <DropdownMenuItem onClick={onReply}>
        <Reply className="mr-2 h-4 w-4" /> Reply
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onForward}>
        <Forward className="mr-2 h-4 w-4" /> Forward
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onCopy}>
        <Copy className="mr-2 h-4 w-4" /> Copy text
      </DropdownMenuItem>

      {canPin && onTogglePin && (
        <DropdownMenuItem onClick={onTogglePin}>
          {isPinned ? (
            <>
              <PinOff className="mr-2 h-4 w-4" /> Unpin
            </>
          ) : (
            <>
              <Pin className="mr-2 h-4 w-4" /> Pin message
            </>
          )}
        </DropdownMenuItem>
      )}

      {isOwn && canEdit && (
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" /> Edit
        </DropdownMenuItem>
      )}

      {isOwn && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  </DropdownMenu>
);

export default MessageContextMenu;

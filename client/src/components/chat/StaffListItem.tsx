// src/components/chat/StaffListItem.tsx (update)
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { StaffMember } from "@/types/conversation.types";
import { getInitials } from "@/lib/formatDate";

interface StaffListItemProps {
  staff: StaffMember;
  isActive: boolean;
  onSelect: (userId: string) => void;
}

const StaffListItem = ({ staff, isActive, onSelect }: StaffListItemProps) => (
  <button
    onClick={() => onSelect(staff._id)}
    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 ${
      isActive ? "bg-primary/5" : ""
    }`}
  >
    <div className="relative">
      <Avatar className="h-11 w-11 shrink-0">
        <AvatarImage src={staff.avatarUrl} alt={staff.name} />
        <AvatarFallback className="bg-muted text-sm font-medium text-muted-foreground">
          {getInitials(staff.name)}
        </AvatarFallback>
      </Avatar>
      {staff.isOnline && (
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
      )}
    </div>
    <div className="min-w-0 flex-1">
      <span className="truncate text-sm font-medium">{staff.name}</span>
      <p className="truncate text-xs capitalize text-muted-foreground">
        {staff.role}
      </p>
    </div>
  </button>
);

export default StaffListItem;

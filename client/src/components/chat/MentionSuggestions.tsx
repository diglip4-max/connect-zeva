import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/formatDate";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface Member {
  _id: string;
  name: string;
  avatarUrl?: string;
}

interface MentionSuggestionsProps {
  open: boolean;
  query: string;
  members: Member[];
  activeIndex: number;
  onSelect: (member: Member) => void;
  children: React.ReactNode;
}

const MentionSuggestions = ({
  open,
  query,
  members,
  activeIndex,
  onSelect,
  children,
}: MentionSuggestionsProps) => {
  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase()),
  );

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current && activeIndex >= 0) {
      const activeElement = listRef.current.children[
        activeIndex
      ] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [activeIndex]);

  return (
    <Popover open={open && filtered.length > 0}>
      <PopoverTrigger>
        <div className="relative">{children}</div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-64 p-1"
      >
        <div ref={listRef} className="max-h-48 overflow-y-auto">
          {filtered.map((member, i) => (
            <button
              key={member._id}
              onClick={() => onSelect(member)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                i === activeIndex
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted",
              )}
            >
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarImage src={member.avatarUrl} />
                <AvatarFallback className="text-[10px]">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{member.name}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MentionSuggestions;

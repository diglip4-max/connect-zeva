// src/components/chat/TypingIndicator.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/formatDate";

interface TypingIndicatorProps {
  showAvatar?: boolean; // sirf group chat me true hoga
  typingUserName?: string;
  typingUserAvatarUrl?: string;
}

const TypingIndicator = ({
  showAvatar,
  typingUserName,
  typingUserAvatarUrl,
}: TypingIndicatorProps) => (
  <div className="flex items-end gap-2">
    {showAvatar && (
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarImage src={typingUserAvatarUrl} alt={typingUserName} />
        <AvatarFallback className="bg-muted text-[10px] font-medium text-muted-foreground">
          {typingUserName ? getInitials(typingUserName) : "?"}
        </AvatarFallback>
      </Avatar>
    )}
    {/* {!showAvatar && <div className="w-7 shrink-0" />} */}

    <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-muted px-4 py-3 shadow-sm">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  </div>
);

export default TypingIndicator;

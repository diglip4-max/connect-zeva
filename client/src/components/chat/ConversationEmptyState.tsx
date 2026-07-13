import { MessageSquareText } from "lucide-react";

const ConversationEmptyState = () => (
  <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
      <MessageSquareText className="h-5 w-5 text-muted-foreground" />
    </div>
    <p className="text-sm font-medium">No conversations yet</p>
    <p className="text-xs text-muted-foreground">
      Start a new chat to get going
    </p>
  </div>
);

export default ConversationEmptyState;

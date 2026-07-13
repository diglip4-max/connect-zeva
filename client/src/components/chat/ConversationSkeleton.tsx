import { Skeleton } from "@/components/ui/skeleton";

const ConversationSkeleton = () => (
  <div className="flex items-center gap-3 px-4 py-3">
    <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-3.5 w-2/3" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  </div>
);

export default ConversationSkeleton;

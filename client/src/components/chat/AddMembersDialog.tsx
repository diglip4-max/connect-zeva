import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/formatDate";
import { fetchClinicStaff } from "@/api/user.api";
import { addGroupMembers } from "@/api/conversation.api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AddMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  existingMemberIds: string[]; // jo already group me hain, unhe list se exclude karna hai
}

const AddMembersDialog = ({
  open,
  onOpenChange,
  conversationId,
  existingMemberIds,
}: AddMembersDialogProps) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  const { data: staff, isLoading } = useQuery({
    queryKey: ["clinic-staff-all"],
    queryFn: fetchClinicStaff,
    enabled: open,
  });

  // sirf wahi staff dikhao jo already group me nahi hain
  const availableStaff = staff?.filter(
    (s) => !existingMemberIds.includes(s._id),
  );

  const filtered = availableStaff?.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleMember = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const resetAndClose = () => {
    setSearch("");
    setSelectedIds([]);
    onOpenChange(false);
  };

  const handleAdd = async () => {
    if (selectedIds.length === 0) return;
    setIsAdding(true);
    try {
      await addGroupMembers(conversationId, selectedIds);
      queryClient.invalidateQueries({ queryKey: ["chat-list"] });
      toast.success(
        `Added ${selectedIds.length} member${selectedIds.length > 1 ? "s" : ""}`,
      );
      resetAndClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add members");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && resetAndClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add members</DialogTitle>
        </DialogHeader>

        <Input
          placeholder="Search staff..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />

        {selectedIds.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {selectedIds.length} selected
          </p>
        )}

        <ScrollArea className="h-72 -mx-1">
          <div className="space-y-0.5 px-1">
            {isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Loading...
              </p>
            ) : filtered && filtered.length > 0 ? (
              filtered.map((member) => {
                const isSelected = selectedIds.includes(member._id);
                return (
                  <button
                    key={member._id}
                    onClick={() => toggleMember(member._id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted",
                      isSelected && "bg-primary/5",
                    )}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={member.avatarUrl} />
                      <AvatarFallback className="bg-primary/10 text-xs text-primary">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {member.name}
                      </p>
                      <p className="truncate text-xs capitalize text-muted-foreground">
                        {member.role}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-border",
                      )}
                    >
                      {isSelected && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {search
                  ? "No staff found"
                  : "Everyone is already in this group"}
              </p>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            onClick={handleAdd}
            disabled={selectedIds.length === 0 || isAdding}
            className="w-full"
          >
            {isAdding
              ? "Adding..."
              : `Add ${selectedIds.length || ""} member${selectedIds.length !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddMembersDialog;

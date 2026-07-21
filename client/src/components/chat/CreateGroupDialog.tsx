import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchClinicStaff } from "@/api/user.api";
import { createGroupConversation } from "@/api/conversation.api";
import { getInitials } from "@/lib/formatDate";
import { cn } from "@/lib/utils";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated: (conversationId: string) => void;
}

const CreateGroupDialog = ({
  open,
  onOpenChange,
  onGroupCreated,
}: CreateGroupDialogProps) => {
  const [step, setStep] = useState<"select" | "name">("select");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: staff, isLoading } = useQuery({
    queryKey: ["clinic-staff-all"],
    queryFn: fetchClinicStaff,
    enabled: open,
  });

  const filtered = staff?.filter((s) =>
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
    setStep("select");
    setSelectedIds([]);
    setGroupName("");
    setSearch("");
    setError(null);
    onOpenChange(false);
  };

  const handleNext = () => {
    if (selectedIds.length < 2) {
      setError("Select at least 2 members to create a group");
      return;
    }
    setError(null);
    setStep("name");
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError("Group name is required");
      return;
    }
    setError(null);
    setIsCreating(true);
    try {
      const conversation = await createGroupConversation(
        groupName.trim(),
        selectedIds,
      );
      onGroupCreated(conversation._id);
      resetAndClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create group");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && resetAndClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {step === "select" ? "New group" : "Name your group"}
          </DialogTitle>
        </DialogHeader>

        {step === "select" ? (
          <>
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
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
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
                    No staff found
                  </p>
                )}
              </div>
            </ScrollArea>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button onClick={handleNext} className="w-full">
                Next ({selectedIds.length})
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-7 w-7 text-primary" />
              </div>

              <div className="w-full space-y-1.5">
                <Label htmlFor="groupName">Group name</Label>
                <Input
                  id="groupName"
                  placeholder="e.g. OPD Team, Front Desk"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  autoFocus
                />
              </div>

              <p className="w-full text-xs text-muted-foreground">
                {selectedIds.length} members selected
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("select")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreating}
                className="flex-1"
              >
                {isCreating ? "Creating..." : "Create group"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupDialog;

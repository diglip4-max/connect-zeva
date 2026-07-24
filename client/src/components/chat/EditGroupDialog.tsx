import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/formatDate";
import { updateGroupSettings } from "@/api/conversation.api";
import { uploadFiles } from "@/api/upload.api";
import { toast } from "sonner";

interface EditGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  currentName: string;
  currentAvatarUrl?: string;
}

const EditGroupDialog = ({
  open,
  onOpenChange,
  conversationId,
  currentName,
  currentAvatarUrl,
}: EditGroupDialogProps) => {
  const queryClient = useQueryClient();
  const [groupName, setGroupName] = useState(currentName);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(
    currentAvatarUrl,
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!groupName.trim()) {
      toast.error("Group name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      let groupAvatarUrl: string | undefined;

      if (avatarFile) {
        const [uploaded] = await uploadFiles([avatarFile]);
        groupAvatarUrl = uploaded.url;
      }

      await updateGroupSettings(conversationId, {
        groupName: groupName.trim(),
        ...(groupAvatarUrl && { groupAvatarUrl }),
      });

      queryClient.invalidateQueries({ queryKey: ["chat-list"] });
      toast.success("Group updated");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update group");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit group</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-2">
          <label className="group relative cursor-pointer">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarPreview} alt={groupName} />
              <AvatarFallback className="bg-primary/10 text-xl font-medium text-primary">
                {getInitials(groupName)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleAvatarSelect}
            />
          </label>

          <div className="w-full space-y-1.5">
            <Label htmlFor="groupName">Group name</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditGroupDialog;

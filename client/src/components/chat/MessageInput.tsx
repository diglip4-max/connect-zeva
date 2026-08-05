// src/components/chat/MessageInput.tsx
import { useState, useRef, type KeyboardEvent, type ChangeEvent } from "react";
import {
  Send,
  Paperclip,
  FileText,
  X,
  Loader2,
  Mic,
  Trash2,
  Pause,
  Play,
  Lock,
  ShieldAlert,
  Copy,
  Check,
  Smile,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSocketContext } from "@/context/SocketContext";
import EmojiPickerButton from "./EmojiPickerButton";
import { cn } from "@/lib/utils";
import { sendMessage } from "@/api/message.api";
import { uploadFiles } from "@/api/upload.api";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { formatDuration } from "@/lib/formatDate";
import type { UploadedAttachment } from "@/types/upload.types";
import { useChatStore } from "@/store/chatStore";
import MentionSuggestions from "./MentionSuggestions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useAuth } from "@/context/AuthContext";

interface MessageInputProps {
  conversationId: string | null;
  recipientId: string | null;
}

const TYPING_DEBOUNCE_MS = 2000;

const MessageInput = ({ conversationId, recipientId }: MessageInputProps) => {
  const { socket } = useSocketContext();
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCurrentlyTypingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const replyingTo = useChatStore((s) => s.replyingTo);
  const setReplyingTo = useChatStore((s) => s.setReplyingTo);
  const permissions = useChatStore((s) => s.permissions);

  const canCreateMessage = permissions?.permission.create ?? true;

  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionPosition, setMentionPosition] = useState(0);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);

  const selectedConversation = useChatStore((s) => s.selectedConversation);
  const isGroup = selectedConversation?.type === "group";
  const groupMembers = selectedConversation?.members || [];

  const filteredMentionMembers = groupMembers.filter((m) =>
    m.name.toLowerCase().includes((mentionQuery || "").toLowerCase()),
  );

  const {
    isRecording,
    isPaused,
    duration,
    audioLevel,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder();

  const isRecordingUIActive = isRecording || isPaused;

  const emitTypingStart = () => {
    if (!socket || !conversationId) return;
    if (!isCurrentlyTypingRef.current) {
      socket.emit("typing:start", { conversationId });
      isCurrentlyTypingRef.current = true;
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", { conversationId });
      isCurrentlyTypingRef.current = false;
    }, TYPING_DEBOUNCE_MS);
  };

  const emitTypingStop = () => {
    if (!socket || !conversationId) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isCurrentlyTypingRef.current) {
      socket.emit("typing:stop", { conversationId });
      isCurrentlyTypingRef.current = false;
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);
    emitTypingStart();

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch && isGroup) {
      setMentionQuery(mentionMatch[1]);
      setMentionPosition(cursorPos - mentionMatch[0].length);
      setActiveMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  };

  const handleSelectMention = (member: { _id: string; name: string }) => {
    const cursorPos = textareaRef.current?.selectionStart ?? text.length;
    const before = text.slice(0, mentionPosition);
    const after = text.slice(cursorPos);
    const newText = `${before}@${member.name} ${after}`;
    setText(newText);
    setMentionQuery(null);

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      const newCursorPos = before.length + member.name.length + 2;
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    });
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setText((prev) => prev + emoji);
      return;
    }

    const start = textarea.selectionStart ?? text.length;
    const end = textarea.selectionEnd ?? text.length;

    const newText = text.slice(0, start) + emoji + text.slice(end);
    setText(newText);

    requestAnimationFrame(() => {
      textarea.focus();
      const newCursorPos = start + emoji.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });

    emitTypingStart();
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPendingFiles((prev) => [...prev, ...files].slice(0, 5));
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const sendWithAttachments = async (files: File[], messageText: string) => {
    setIsSending(true);
    let attachments: UploadedAttachment[] = [];

    try {
      if (files.length > 0) {
        setIsUploading(true);
        attachments = await uploadFiles(files);
        setIsUploading(false);
      }

      await sendMessage({
        ...(conversationId
          ? { conversationId }
          : { recipientId: recipientId ?? undefined }),
        text: messageText || undefined,
        attachments,
        replyTo: replyingTo?.messageId,
      });
      setReplyingTo(null);
    } catch (err) {
      console.error("Failed to send message", err);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && pendingFiles.length === 0) return;
    if (isSending || isUploading) return;

    const filesToSend = pendingFiles;
    const messageText = trimmed;
    setText("");
    setPendingFiles([]);
    emitTypingStop();

    await sendWithAttachments(filesToSend, messageText);
  };

  //   const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
  //     if (e.key === "Enter" && !e.shiftKey) {
  //       e.preventDefault();
  //       handleSend();
  //     }
  //   };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && filteredMentionMembers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveMentionIndex((i) => (i + 1) % filteredMentionMembers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveMentionIndex(
          (i) =>
            (i - 1 + filteredMentionMembers.length) %
            filteredMentionMembers.length,
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        handleSelectMention(filteredMentionMembers[activeMentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        setMentionQuery(null);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMicClick = async () => {
    const result = await startRecording();

    if (!result.success) {
      if (result.error === "permission-denied") {
        toast.error("Microphone access denied", {
          description:
            "Please allow microphone access in your browser settings to send voice messages.",
        });
      } else if (result.error === "not-supported") {
        toast.error("Microphone not available", {
          description:
            "No microphone was found, or this browser doesn't support voice recording.",
        });
      } else {
        toast.error("Could not start recording", {
          description: "Something went wrong. Please try again.",
        });
      }
    }
  };

  const handlePauseResume = () => {
    if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  const handleStopAndSend = async () => {
    const audioFile = await stopRecording();
    if (audioFile) {
      await sendWithAttachments([audioFile], "");
    }
  };

  const handleCancelRecording = () => {
    cancelRecording();
  };

  const hasContent = text.trim().length > 0 || pendingFiles.length > 0;

  const handleCopyAdminEmail = async () => {
    try {
      await navigator.clipboard.writeText("admin@yourclinic.com");
      setCopied(true);
      toast.success("Email copied — ask your admin for messaging access");
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Could not copy — please write to your clinic administrator");
    }
  };

  if (!canCreateMessage) {
    return (
      <div className="border-t border-border/40 bg-gradient-to-b from-background/0 to-background/80 p-4 backdrop-blur-sm">
        <Dialog open={showAccessDialog} onOpenChange={setShowAccessDialog}>
          <div className="mb-3 flex items-center gap-2 px-1">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              <Lock className="h-3 w-3" />
              Read-only
            </span>
            <span className="truncate text-xs text-muted-foreground">
              You can view this conversation — messaging access is disabled for
              your role.
            </span>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => setShowAccessDialog(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setShowAccessDialog(true);
              }
            }}
            className={cn(
              "group relative flex items-center gap-2 rounded-2xl border bg-card/30 p-1.5 transition-all duration-200",
              "border-border/50 opacity-90",
              "cursor-pointer hover:border-primary/30 hover:bg-card/60 hover:opacity-100",
            )}
          >
            <div className="flex items-center gap-1 px-1">
              <Tooltip>
                <TooltipTrigger className="pointer-events-none">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled
                    className="h-9 w-9 shrink-0 cursor-not-allowed rounded-full text-muted-foreground/50"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Attachments require messaging access
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger className="pointer-events-none">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled
                    className="h-9 w-9 shrink-0 cursor-not-allowed rounded-full text-muted-foreground/50"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Emoji require messaging access
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="w-full flex items-center">
              <Textarea
                readOnly
                placeholder="Ask your clinic admin for messaging access to send messages, share files, record voice notes & @mention staff in groups."
                rows={1}
                className="w-full min-h-[40px] resize-none cursor-pointer border-0 bg-transparent px-2 py-2.5 text-sm text-muted-foreground/80 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/55"
              />
            </div>

            <div>
              <Tooltip>
                <TooltipTrigger className="w-full">
                  <Button
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAccessDialog(true);
                    }}
                    className="h-9 w-9 shrink-0 rounded-full bg-muted/60 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  >
                    <Lock className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  Request messaging access
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="mt-1 h-4 text-center">
            <span className="text-xs text-muted-foreground/40 transition-all duration-300 group-hover:text-muted-foreground/60">
              Click anywhere above to learn how to unlock messaging
            </span>
          </div>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-inset ring-amber-500/20 dark:text-amber-400">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <DialogTitle className="text-left">
                    Messaging access is locked
                  </DialogTitle>
                  <DialogDescription className="text-left">
                    Your role ({user?.role || "staff"}) doesn&apos;t have
                    permission to{" "}
                    <span className="font-medium text-foreground">
                      create messages
                    </span>{" "}
                    right now. The feature preview is shown here so you know it
                    exists — reach out to unlock it.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-2 rounded-xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
              <p className="mb-1 font-medium text-foreground/90">
                With messaging access you can:
              </p>
              <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                  1-on-1 chats with clinic staff
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                  Group conversations &amp; @mentions
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                  Share files, images &amp; PDFs
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                  Voice messages &amp; emoji reactions
                </li>
              </ul>
            </div>

            <DialogFooter className="sm:justify-between">
              <Button
                variant="outline"
                onClick={() => setShowAccessDialog(false)}
              >
                Maybe later
              </Button>
              <Button onClick={handleCopyAdminEmail}>
                {copied ? (
                  <>
                    <Check className="mr-1.5 h-4 w-4" />
                    Email copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 h-4 w-4" />
                    Copy admin email
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="border-t border-border/40 bg-gradient-to-b from-background/0 to-background/80 p-4 backdrop-blur-sm">
      {pendingFiles.length > 0 && !isRecordingUIActive && (
        <div className="flex flex-wrap gap-3 border-b border-border/40 px-3 pb-3 pt-3">
          {pendingFiles.map((file, i) => {
            const isImage = file.type.startsWith("image/");
            return (
              <div key={i} className="group relative h-16 w-16 shrink-0">
                <div className="h-full w-full overflow-hidden rounded-sm border border-border/60 bg-muted/50">
                  {isImage ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-1.5">
                      <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <span className="w-full truncate text-center text-[9px] leading-tight text-muted-foreground">
                        {file.name}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => removeFile(i)}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background opacity-0 shadow-md transition-all hover:scale-110 group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {replyingTo && (
        <div className="mb-2 flex items-center justify-between rounded-lg border-l-2 border-primary bg-muted/50 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-primary">
              {replyingTo.senderName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {replyingTo.text}
            </p>
          </div>
          <button onClick={() => setReplyingTo(null)}>
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      )}

      {isRecordingUIActive ? (
        <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full text-destructive hover:bg-destructive/10"
            onClick={handleCancelRecording}
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <div className="flex flex-1 items-center gap-2.5 overflow-hidden">
            <span
              className={cn(
                "h-2.5 w-2.5 shrink-0 rounded-full bg-destructive",
                isRecording && "animate-pulse",
              )}
            />

            <div className="flex h-6 flex-1 items-center gap-[2px] overflow-hidden">
              {Array.from({ length: 40 }).map((_, i) => {
                const barHeight = isRecording
                  ? Math.max(0.15, audioLevel * (0.6 + Math.sin(i * 0.8) * 0.4))
                  : 0.15;
                return (
                  <div
                    key={i}
                    className="w-[2.5px] shrink-0 rounded-full bg-destructive/60 transition-all duration-100"
                    style={{ height: `${barHeight * 100}%` }}
                  />
                );
              })}
            </div>

            <span className="shrink-0 text-sm font-medium tabular-nums text-destructive">
              {formatDuration(duration)}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full text-destructive hover:bg-destructive/10"
            onClick={handlePauseResume}
          >
            {isPaused ? (
              <Play className="h-4 w-4 fill-current" />
            ) : (
              <Pause className="h-4 w-4 fill-current" />
            )}
          </Button>

          <Button
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full bg-primary shadow-lg shadow-primary/30"
            onClick={handleStopAndSend}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "group relative flex items-end gap-2 rounded-2xl border bg-card/50 p-1.5 transition-all duration-300",
            isFocused
              ? "border-primary/40 shadow-lg shadow-primary/5 ring-2 ring-primary/10"
              : "border-border/60 hover:border-border/80",
          )}
        >
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 transition-opacity group-focus-within:opacity-100" />

          <div className="flex items-center gap-1 px-1">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={handleFileSelect}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:bg-primary/5 hover:text-primary"
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <EmojiPickerButton onEmojiSelect={handleEmojiSelect} />
          </div>

          <div className="w-full flex items-center">
            <MentionSuggestions
              open={mentionQuery !== null}
              query={mentionQuery || ""}
              members={groupMembers}
              activeIndex={activeMentionIndex}
              onSelect={handleSelectMention}
            >
              <Textarea
                ref={textareaRef}
                value={text}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Type a message..."
                rows={1}
                className="w-full max-h-32 min-h-[40px] resize-none border-0 bg-transparent px-2 py-2.5 text-sm leading-relaxed shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60"
              />
            </MentionSuggestions>
          </div>

          {hasContent ? (
            <Button
              size="icon"
              className={cn(
                "h-9 w-9 shrink-0 rounded-full transition-all duration-300",
                "bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40",
              )}
              disabled={isSending || isUploading}
              onClick={handleSend}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4 translate-x-px" />
              )}
            </Button>
          ) : (
            <Button
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full bg-muted/50 text-muted-foreground transition-all hover:bg-muted/70"
              onClick={handleMicClick}
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      <div className="mt-1 h-4 text-center">
        <span className="text-xs text-muted-foreground/0 transition-all duration-300 group-focus-within:text-muted-foreground/40">
          {isFocused && "Shift + Enter for new line"}
        </span>
      </div>
    </div>
  );
};

export default MessageInput;

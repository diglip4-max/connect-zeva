import { useState, useRef, type KeyboardEvent } from "react";
import { Send, Paperclip, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSocketContext } from "@/context/SocketContext";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  conversationId: string | null;
  recipientId: string | null;
}

const TYPING_DEBOUNCE_MS = 2000;

const MessageInput = ({ conversationId, recipientId }: MessageInputProps) => {
  const { socket } = useSocketContext();
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTyping = () => {
    if (!socket || !conversationId) return;

    socket.emit("typing:start", { conversationId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", { conversationId });
    }, TYPING_DEBOUNCE_MS);
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || !socket) return;

    socket.emit("message:send", {
      ...(conversationId ? { conversationId } : { recipientId }),
      text: trimmed,
    } as any);

    setText("");
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (conversationId) socket.emit("typing:stop", { conversationId });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border/40 bg-gradient-to-b from-background/0 to-background/80 p-4 backdrop-blur-sm">
      <div
        className={cn(
          "group relative flex items-end gap-2 rounded-2xl border bg-card/50 p-1.5 transition-all duration-300",
          isFocused
            ? "border-primary/40 shadow-lg shadow-primary/5 ring-2 ring-primary/10"
            : "border-border/60 hover:border-border/80",
        )}
      >
        {/* Decorative gradient line */}
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 transition-opacity group-focus-within:opacity-100" />

        <div className="flex items-center gap-1 px-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full text-muted-foreground transition-all hover:bg-primary/5 hover:text-primary"
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full text-muted-foreground transition-all hover:bg-primary/5 hover:text-primary"
            title="Add emoji"
          >
            <Smile className="h-4 w-4" />
          </Button>
        </div>

        <Textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Type a message..."
          rows={1}
          className="max-h-32 min-h-[40px] resize-none border-0 bg-transparent px-2 py-2.5 text-sm leading-relaxed shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60"
        />

        <Button
          size="icon"
          className={cn(
            "h-9 w-9 shrink-0 rounded-full transition-all duration-300",
            text.trim()
              ? "bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40"
              : "bg-muted/50 text-muted-foreground hover:bg-muted/70",
          )}
          disabled={!text.trim()}
          onClick={handleSend}
        >
          <Send
            className={cn(
              "h-4 w-4 transition-transform",
              text.trim() && "translate-x-px",
            )}
          />
        </Button>
      </div>

      {/* Typing indicator placeholder - subtle */}
      <div className="mt-1 h-4 text-center">
        <span className="text-xs text-muted-foreground/0 transition-all duration-300 group-focus-within:text-muted-foreground/40">
          {isFocused && "Shift + Enter for new line"}
        </span>
      </div>
    </div>
  );
};

export default MessageInput;

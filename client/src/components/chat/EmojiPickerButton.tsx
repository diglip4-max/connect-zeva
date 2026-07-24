import { useState } from "react";
import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTheme } from "@/context/ThemeContext";

interface EmojiPickerButtonProps {
  trigger?: React.ReactNode;
  onEmojiSelect: (emoji: string) => void;
}

const EmojiPickerButton = ({
  trigger,
  onEmojiSelect,
}: EmojiPickerButtonProps) => {
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();

  // "system" resolve karo actual light/dark me
  const resolvedTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        {trigger ? (
          trigger
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full text-muted-foreground transition-all hover:bg-primary/5 hover:text-primary"
            title="Add emoji"
          >
            <Smile className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-auto border-border/60 p-0 shadow-xl"
      >
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          theme={resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT}
          searchDisabled={false}
          skinTonesDisabled
          width={320}
          height={400}
          previewConfig={{ showPreview: false }}
          style={
            {
              "--epr-bg-color": "hsl(var(--popover))",
              "--epr-category-label-bg-color": "hsl(var(--popover))",
              "--epr-text-color": "hsl(var(--popover-foreground))",
              "--epr-hover-bg-color": "hsl(var(--muted))",
              "--epr-search-input-bg-color": "hsl(var(--muted))",
              "--epr-picker-border-color": "hsl(var(--border))",
              "--epr-header-padding": "12px",
              "--epr-emoji-size": "22px",
              "--epr-category-navigation-button-size": "26px",
            } as React.CSSProperties
          }
        />
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPickerButton;

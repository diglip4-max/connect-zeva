import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CirclePlus, SmilePlus } from "lucide-react";
import EmojiPickerButton from "./EmojiPickerButton";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
}

const ReactionPicker = ({ onSelect }: ReactionPickerProps) => (
  <Popover>
    <PopoverTrigger>
      <button className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
        <SmilePlus className="h-4 w-4" />
      </button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-1.5" side="top">
      <div className="flex gap-1">
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg transition-transform hover:scale-125 hover:bg-muted"
          >
            {emoji}
          </button>
        ))}

        <EmojiPickerButton
          trigger={
            <button className="flex h-8 w-8 items-center justify-center rounded-full text-lg transition-transform hover:bg-muted hover:text-primary">
              <CirclePlus className="h-4 w-4" />
            </button>
          }
          onEmojiSelect={(emoji) => onSelect(emoji)}
        />
      </div>
    </PopoverContent>
  </Popover>
);

export default ReactionPicker;

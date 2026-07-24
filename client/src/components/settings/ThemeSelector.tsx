import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light" as const, label: "Light", icon: Sun },
  { value: "dark" as const, label: "Dark", icon: Moon },
  { value: "system" as const, label: "System", icon: Monitor },
];

const ThemeSelector = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="grid grid-cols-3 gap-2">
      {OPTIONS.map((option) => {
        const isActive = theme === option.value;
        return (
          <button
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border p-3 transition-colors",
              isActive
                ? "border-primary bg-primary/5 text-primary"
                : "border-border/60 text-muted-foreground hover:bg-muted/60",
            )}
          >
            <option.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ThemeSelector;

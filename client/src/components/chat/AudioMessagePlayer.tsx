import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioMessagePlayerProps {
  url: string;
  isOwn: boolean;
}

// static waveform bars - random-ish heights, ek baar generate honge aur consistent rahenge
const WAVEFORM_BARS = Array.from({ length: 32 }, (_, i) => {
  // thoda variation dete hain taaki natural waveform jaisa lage, sine-based pattern
  const base = Math.sin(i * 0.5) * 0.3 + 0.5;
  const noise = Math.sin(i * 1.7) * 0.2;
  return Math.max(0.25, Math.min(1, base + noise));
});

function formatTime(seconds: number) {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const AudioMessagePlayer = ({ url, isOwn }: AudioMessagePlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoaded(true);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const activeBarIndex = Math.floor((progress / 100) * WAVEFORM_BARS.length);

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-2xl p-2 pr-3",
        isOwn ? "bg-black/10" : "bg-background/60",
      )}
    >
      <audio ref={audioRef} src={url} preload="metadata" />

      {/* Play/Pause button with pulse when playing */}
      <button
        onClick={togglePlay}
        disabled={!isLoaded}
        className={cn(
          "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95",
          isOwn
            ? "bg-primary-foreground text-primary"
            : "bg-primary text-primary-foreground",
        )}
      >
        {isPlaying && (
          <span
            className={cn(
              "absolute inset-0 animate-ping rounded-full opacity-30",
              isOwn ? "bg-primary-foreground" : "bg-primary",
            )}
          />
        )}
        {isPlaying ? (
          <Pause className="h-4 w-4 relative fill-current -ml-0.5" />
        ) : (
          <Play className="h-4 w-4 relative fill-current -ml-0.5 translate-x-0.5" />
        )}
      </button>

      {/* Waveform + time */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div
          onClick={handleSeek}
          className="flex h-7 cursor-pointer items-center gap-[2.5px]"
        >
          {WAVEFORM_BARS.map((height, i) => {
            const isActive = i <= activeBarIndex;
            return (
              <div
                key={i}
                className={cn(
                  "w-[3px] rounded-full transition-colors",
                  isActive
                    ? isOwn
                      ? "bg-primary-foreground"
                      : "bg-primary"
                    : isOwn
                      ? "bg-primary-foreground/30"
                      : "bg-muted-foreground/30",
                  // playing hone par active bar thoda animate ho
                  isPlaying &&
                    isActive &&
                    i === activeBarIndex &&
                    "animate-pulse",
                )}
                style={{ height: `${height * 100}%` }}
              />
            );
          })}
        </div>

        <span
          className={cn(
            "text-[10px] tabular-nums",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {formatTime(isPlaying || currentTime > 0 ? currentTime : duration)}
        </span>
      </div>
    </div>
  );
};

export default AudioMessagePlayer;

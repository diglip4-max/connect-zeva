// src/pages/NotFound.tsx
import { useNavigate } from "react-router-dom";
import {
  MessageSquareOff,
  Home,
  ArrowLeft,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const NotFound = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-[350px] w-[350px] rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-20 left-0 h-[300px] w-[300px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Floating decorative chat bubbles - subtle, out of focus */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.15]">
        <MessageCircle className="absolute left-[12%] top-[20%] h-8 w-8 rotate-12 text-primary animate-[float_6s_ease-in-out_infinite]" />
        <MessageCircle className="absolute right-[15%] top-[28%] h-6 w-6 -rotate-12 text-primary animate-[float_8s_ease-in-out_infinite_1s]" />
        <MessageCircle className="absolute bottom-[25%] left-[18%] h-5 w-5 rotate-6 text-primary animate-[float_7s_ease-in-out_infinite_0.5s]" />
        <MessageCircle className="absolute bottom-[20%] right-[12%] h-7 w-7 -rotate-6 text-primary animate-[float_9s_ease-in-out_infinite_1.5s]" />
      </div>

      <div className="relative flex flex-col items-center gap-7 text-center">
        {/* Icon cluster */}
        <div className="relative flex h-28 w-28 items-center justify-center">
          <div className="absolute inset-0 animate-pulse rounded-full bg-primary/10" />
          <div className="absolute inset-2 rounded-full bg-primary/5 blur-md" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-primary/15 bg-gradient-to-b from-primary/15 to-primary/5 shadow-lg shadow-primary/10">
            <MessageSquareOff
              className="h-10 w-10 text-primary"
              strokeWidth={1.75}
            />
          </div>
          <Sparkles className="absolute -right-1 -top-1 h-5 w-5 text-primary/60" />
        </div>

        <div className="space-y-3">
          <p className="bg-gradient-to-b from-foreground/20 to-foreground/5 bg-clip-text text-8xl font-bold leading-none tracking-tight text-transparent">
            404
          </p>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              This page went offline
            </h1>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              The page you're looking for doesn't exist, or may have been moved.
              Let's get you back to your conversations.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="gap-2 border-border/60"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </Button>
          <Button
            onClick={() => navigate(isAuthenticated ? "/chat" : "/auth/login")}
            className="gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40"
          >
            <Home className="h-4 w-4" />
            {isAuthenticated ? "Back to Chats" : "Go to Login"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground/60">
          Error code: <span className="font-mono">404_NOT_FOUND</span>
        </p>
      </div>
    </div>
  );
};

export default NotFound;

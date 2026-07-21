import { useEffect, useState } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const DISMISS_BLOCKED_KEY = "zeva_messenger_notif_blocked_dismissed";
const ALREADY_SUBSCRIBED_KEY = "zeva_messenger_push_subscribed";

const NotificationPermissionGate = () => {
  const { requestPermissionAndSubscribe } = usePushNotifications();
  const [bannerType, setBannerType] = useState<"ask" | "blocked" | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) return;

    const permission = Notification.permission;

    if (permission === "default") {
      setBannerType("ask"); // custom banner dikhao, native popup abhi nahi
    } else if (permission === "denied") {
      const dismissed = localStorage.getItem(DISMISS_BLOCKED_KEY);
      if (!dismissed) setBannerType("blocked");
    } else if (permission === "granted") {
      // sirf ek baar per-session/per-device subscribe confirm karo, har mount pe nahi
      const alreadyDone = localStorage.getItem(ALREADY_SUBSCRIBED_KEY);
      if (!alreadyDone) {
        requestPermissionAndSubscribe().then(() => {
          localStorage.setItem(ALREADY_SUBSCRIBED_KEY, "true");
        });
      }
    }
  }, [requestPermissionAndSubscribe]);

  const handleEnableClick = async () => {
    setIsRequesting(true);
    try {
      const success = await requestPermissionAndSubscribe();
      if (success) {
        localStorage.setItem(ALREADY_SUBSCRIBED_KEY, "true");
        setBannerType(null);
      } else if (Notification.permission === "denied") {
        setBannerType("blocked");
      } else {
        setBannerType(null); // user ne dismiss kiya native prompt bina decide kiye
      }
    } catch (err) {
      console.error("Failed to enable notifications", err);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismissAsk = () => {
    setBannerType(null); // is session ke liye chhupa do, agli baar phir pucho (persist nahi kiya)
  };

  const handleDismissBlocked = () => {
    localStorage.setItem(DISMISS_BLOCKED_KEY, "true");
    setBannerType(null);
  };

  if (!bannerType) return null;

  if (bannerType === "ask") {
    return (
      <div className="flex items-center gap-3 border-b border-primary/20 bg-primary/5 px-4 py-2.5">
        <Bell className="h-4 w-4 shrink-0 text-primary" />
        <p className="flex-1 text-xs text-foreground">
          Turn on notifications to get alerts for new messages, even when this
          tab isn't active.
        </p>
        <Button
          size="sm"
          className="h-7 text-xs rounded-sm"
          onClick={handleEnableClick}
          disabled={isRequesting}
        >
          {isRequesting ? "Enabling..." : "Enable"}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleDismissAsk}
          className="h-6 w-6 shrink-0 rounded-sm text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5">
      <BellOff className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="flex-1 text-xs text-amber-700 dark:text-amber-300">
        Notifications are blocked. Enable them in your browser's site settings
        to get message alerts.
      </p>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDismissBlocked}
        className="h-6 w-6 shrink-0 rounded-sm text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

export default NotificationPermissionGate;

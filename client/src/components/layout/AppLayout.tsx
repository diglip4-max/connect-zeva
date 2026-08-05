import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import NotificationPermissionGate from "../common/NotificationPermissionGate";
import { useSocketEvent } from "@/hooks/useSocket";
import type { MessageDTO } from "@/types/message.types";
import { useAuth } from "@/context/AuthContext";
import AttachmentViewer from "../chat/AttachmentViewer";
import { useState, useEffect } from "react";
import { toast } from "sonner"; // or your toast library
import { useNavigate } from "react-router-dom";

const AppLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notificationCount, setNotificationCount] = useState(0);

  // global listener - jo bhi conversation ho, jo bhi page ho, yeh hamesha active rahega
  useSocketEvent<MessageDTO>("message:new", async (msg) => {
    // sirf tab dikhao jab: permission granted ho,
    // AUR sabse important - yeh message KHUD ka bheja hua na ho
    const isOwnMessage = msg.senderId._id === user?.id;

    if (isOwnMessage) return;

    // ✅ Agar app visible hai - In-App Notification
    if (!document.hidden) {
      // In-App Notification (Toast)
      showInAppNotification(msg);

      // Update badge counter
      setNotificationCount((prev) => prev + 1);

      // Play sound
      playNotificationSound();

      return;
    }

    // ✅ Agar app hidden hai - Browser Notification
    if (Notification.permission === "granted") {
      try {
        const registration = await navigator.serviceWorker.getRegistration();

        if (registration) {
          await registration.showNotification(msg.senderId.name, {
            body: msg.text || "Sent an attachment",
            icon: "/icon-192.png",
            badge: "/badge-72.png",
            data: {
              conversationId: msg.conversationId,
              messageId: msg._id,
              senderName: msg.senderId.name,
              url: `/chat/${msg.conversationId}`,
              type: "chat_message",
            },
            requireInteraction: true,
            tag: msg.conversationId,
          });
        } else {
          // Fallback: Regular notification
          const notification = new Notification(msg.senderId.name, {
            body: msg.text || "Sent an attachment",
            icon: "/icon-192.png",
            data: {
              conversationId: msg.conversationId,
              url: `/chat/${msg.conversationId}`,
            },
          });

          notification.onclick = () => {
            window.focus();
            navigate(`/chat/${msg.conversationId}`);
          };
        }
      } catch (error) {
        console.error("Notification error:", error);
      }
    }
  });

  // ✅ In-App Notification function
  const showInAppNotification = (msg: MessageDTO) => {
    // Using Sonner toast (popular library)
    toast.info(msg.senderId.name, {
      description: msg.text || "Sent an attachment",
      duration: 5000,
      icon: "💬",
      action: {
        label: "View",
        onClick: () => navigate(`/chat/${msg.conversationId}`),
      },
    });
  };

  // ✅ Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio("/sounds/notification.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Auto-play blocked, ignore
        console.info("Notification sound auto-play blocked");
      });
    } catch (error) {
      // Silently fail
      console.error("Notification sound error:", error);
    }
  };

  // ✅ Reset notification count when user focuses on app
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setNotificationCount(0);
        // Update document title
        document.title = "Zeva Connect";
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // ✅ Update document title with notification count
  useEffect(() => {
    if (notificationCount > 0) {
      document.title = `(${notificationCount}) Zeva Connect`;
    } else {
      document.title = "Zeva Connect";
    }
  }, [notificationCount]);

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <NotificationPermissionGate />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>

      {/* Viewer */}
      <AttachmentViewer />
    </div>
  );
};

export default AppLayout;

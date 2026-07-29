import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import NotificationPermissionGate from "../common/NotificationPermissionGate";
import { useSocketEvent } from "@/hooks/useSocket";
import type { MessageDTO } from "@/types/message.types";
import { useAuth } from "@/context/AuthContext";
import AttachmentViewer from "../chat/AttachmentViewer";

const AppLayout = () => {
  const { user } = useAuth();
  // global listener - jo bhi conversation ho, jo bhi page ho, yeh hamesha active rahega
  useSocketEvent<MessageDTO>("message:new", (msg) => {
    // sirf tab dikhao jab: tab hidden ho, permission granted ho,
    // AUR sabse important - yeh message KHUD ka bheja hua na ho
    const isOwnMessage = msg.senderId._id === user?.id;

    if (
      !isOwnMessage &&
      document.hidden &&
      Notification.permission === "granted"
    ) {
      new Notification(msg.senderId.name, {
        body: msg.text || "Sent an attachment",
        icon: "/icon-192.png",
      });
    }
  });

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

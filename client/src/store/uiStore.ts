import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  isSidebarCollapsed: boolean;
  isInfoPanelOpen: boolean;
  isMobileSidebarOpen: boolean; // naya
  toggleSidebar: () => void;
  toggleInfoPanel: () => void;
  closeInfoPanel: () => void;
  toggleMobileSidebar: () => void; // naya
  closeMobileSidebar: () => void; // naya

  //   Viewer
  viewerAttachment: {
    url: string;
    type: "image" | "video" | "document" | "audio" | "file";
    fileName: string;
    fileSize: number;
    mimeType: string;
  } | null;
  attachmentSenderInfo: {
    name: string;
    avatarUrl?: string;
    date: string;
  } | null;
  selectedMessageId: string | null;
  viewerGallery: { url: string; type: string; fileName: string }[]; // same-message ke andar navigate karne ke liye
  openViewer: (
    attachment: UIState["viewerAttachment"],
    gallery?: UIState["viewerGallery"],
    senderInfo?: UIState["attachmentSenderInfo"],
    selectedMessageId?: UIState["selectedMessageId"],
  ) => void;
  closeViewer: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarCollapsed: false,
      isInfoPanelOpen: false,
      isMobileSidebarOpen: false,
      toggleSidebar: () =>
        set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      toggleInfoPanel: () =>
        set((state) => ({ isInfoPanelOpen: !state.isInfoPanelOpen })),
      closeInfoPanel: () => set({ isInfoPanelOpen: false }),
      toggleMobileSidebar: () =>
        set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
      closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),

      //   Viewer
      viewerAttachment: null,
      viewerGallery: [],
      attachmentSenderInfo: null,
      selectedMessageId: null,
      openViewer: (
        attachment,
        gallery = [],
        senderInfo = null,
        selectedMessageId = null,
      ) =>
        set({
          viewerAttachment: attachment,
          viewerGallery: gallery,
          attachmentSenderInfo: senderInfo,
          selectedMessageId,
        }),
      closeViewer: () =>
        set({
          viewerAttachment: null,
          viewerGallery: [],
          attachmentSenderInfo: null,
          selectedMessageId: null,
        }),
    }),
    {
      name: "zeva_connect_ui",
      partialize: (state) => ({ isSidebarCollapsed: state.isSidebarCollapsed }), // sirf yeh persist karo, baaki session-only
    },
  ),
);

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
    }),
    {
      name: "zeva_messenger_ui",
      partialize: (state) => ({ isSidebarCollapsed: state.isSidebarCollapsed }), // sirf yeh persist karo, baaki session-only
    },
  ),
);

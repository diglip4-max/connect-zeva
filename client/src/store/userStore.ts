import { create } from "zustand";

interface OnlineStatus {
  [userId: string]: boolean;
}

interface UserState {
  onlineUsers: OnlineStatus;
  setUserOnline: (userId: string, isOnline: boolean) => void;
  isUserOnline: (userId: string) => boolean;
}

export const useUserStore = create<UserState>((set, get) => ({
  onlineUsers: {},

  setUserOnline: (userId, isOnline) =>
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, [userId]: isOnline },
    })),

  isUserOnline: (userId) => !!get().onlineUsers[userId],
}));

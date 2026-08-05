// lib/storage.ts
const STORAGE_KEYS = {
  REDIRECT_AFTER_LOGIN: "redirectAfterLogin",
} as const;

export const storage = {
  // ✅ Use both, but prioritize localStorage
  setRedirect: (url: string) => {
    localStorage.setItem(STORAGE_KEYS.REDIRECT_AFTER_LOGIN, url);
    // Backup for incognito
    sessionStorage.setItem(STORAGE_KEYS.REDIRECT_AFTER_LOGIN, url);
  },

  getRedirect: () => {
    // Try localStorage first
    let url = localStorage.getItem(STORAGE_KEYS.REDIRECT_AFTER_LOGIN);

    // Fallback to sessionStorage
    if (!url) {
      url = sessionStorage.getItem(STORAGE_KEYS.REDIRECT_AFTER_LOGIN);
    }

    return url;
  },

  clearRedirect: () => {
    localStorage.removeItem(STORAGE_KEYS.REDIRECT_AFTER_LOGIN);
    sessionStorage.removeItem(STORAGE_KEYS.REDIRECT_AFTER_LOGIN);
  },
};

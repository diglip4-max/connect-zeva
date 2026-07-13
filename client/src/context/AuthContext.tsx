import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { getCurrentUser } from "@/api/auth.api";
import axiosClient, {
  setAccessToken,
  //  getAccessToken
} from "@/api/axiosClient";
import type { IUser } from "@/types/user.types";

interface AuthContextValue {
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: IUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasAttemptedRestore = React.useRef(false);

  useEffect(() => {
    if (hasAttemptedRestore.current) return; // dusri baar chalne pe skip
    hasAttemptedRestore.current = true;
    // page load par - refresh token cookie se silently naya access token lene ki koshish karo
    const tryRestoreSession = async () => {
      try {
        const { data } = await axiosClient.post("/auth/refresh");
        setAccessToken(data.data.accessToken);

        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    tryRestoreSession();

    // axios interceptor se aane wala global event - session expire hone par
    const handleSessionExpired = () => {
      setUser(null);
      setAccessToken(null);
    };
    window.addEventListener("session-expired", handleSessionExpired);

    return () =>
      window.removeEventListener("session-expired", handleSessionExpired);
  }, []);

  const login = (token: string, newUser: IUser) => {
    setAccessToken(token);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await axiosClient.post("/auth/logout");
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

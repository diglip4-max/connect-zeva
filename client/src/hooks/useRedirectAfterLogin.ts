// hooks/useRedirectAfterLogin.ts
import { useNavigate } from "react-router-dom";
import { storage } from "@/lib/storage";

export const useRedirectAfterLogin = () => {
  const navigate = useNavigate();

  const handleRedirect = () => {
    // Get redirect URL from storage
    const redirectUrl = storage.getRedirect();

    // Clean up
    storage.clearRedirect();

    // Validate and redirect
    if (redirectUrl && redirectUrl !== "/auth/sso") {
      console.log("[useRedirectAfterLogin] ✅ Redirecting to:", redirectUrl);
      navigate(redirectUrl, { replace: true });
      return true;
    } else {
      console.log("[useRedirectAfterLogin] ℹ️ No redirect found, going home");
      navigate("/", { replace: true });
      return false;
    }
  };

  return { handleRedirect };
};

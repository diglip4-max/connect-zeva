// src/pages/SSOCallback.tsx
import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ShieldAlert, ArrowRight } from "lucide-react";
import { verifySSOTicket } from "@/api/auth.api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRedirectAfterLogin } from "@/hooks/useRedirectAfterLogin";
import { importUsersFromZevaClinic } from "@/api/user.api";

type Status = "verifying" | "error";

const SSOCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState<Status>("verifying");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const hasAttemptedRef = useRef(false); // naya - StrictMode double-invoke rokने ke liए

  const { handleRedirect } = useRedirectAfterLogin();

  const attemptLogin = () => {
    setStatus("verifying");
    const ticket = searchParams.get("ticket");

    if (!ticket) {
      setErrorMessage(
        "No login ticket found. Please open Zeva Connect from Zeva Clinic.",
      );
      setStatus("error");
      return;
    }

    verifySSOTicket(ticket)
      .then(async ({ token, user }) => {
        setTimeout(async () => {
          if (!token || !user) {
            setErrorMessage(
              "Login ticket verification failed. Please try again from Zeva Clinic.",
            );
            setStatus("error");
            return;
          }
          login(token, user);

          //   import users from clinic
          await importUsersFromZevaClinic(token);

          // Redirect to stored URL or default to "/chat"
          handleRedirect();
        }, 3000);
      })
      .catch(() => {
        setErrorMessage(
          "Your login ticket is invalid or has expired. Please try again from Zeva Clinic.",
        );
        setStatus("error");
      });
  };

  useEffect(() => {
    // sirf pehli baar hi chalao - "Try again" button dobara call kar sakta hai manually
    if (hasAttemptedRef.current) return;
    hasAttemptedRef.current = true;

    attemptLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // "Try again" button ka onClick - guard ko reset karke dobara try kare
  const handleRetry = () => {
    hasAttemptedRef.current = true; // already true hai, sirf attemptLogin() seedha call karo
    attemptLogin();
  };

  if (status === "error") {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative w-full max-w-sm">
          <div className="mb-6 flex flex-col items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <ShieldAlert className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Zeva Connect
            </span>
          </div>

          <Card className="border-border/40 bg-card/80 shadow-xl shadow-black/[0.03] backdrop-blur-sm">
            <CardHeader className="flex flex-col items-center gap-3 pb-2 pt-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20">
                <ShieldAlert className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-lg font-semibold tracking-tight">
                  Login failed
                </CardTitle>
                <CardDescription className="px-3 text-sm leading-relaxed">
                  {errorMessage}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-2 px-6 pb-8 pt-5">
              <Button onClick={handleRetry} className="w-full shadow-sm">
                Try again
              </Button>
              <Button
                variant="outline"
                className="w-full border-border/60"
                onClick={() => navigate("/auth/login")}
              >
                Login with email & password
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Secured by Zeva Clinic single sign-on
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
            <Loader2 className="h-5 w-5 animate-spin text-primary-foreground" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            Zeva Connect
          </span>
        </div>

        <Card className="border-border/40 bg-card/80 shadow-xl shadow-black/[0.03] backdrop-blur-sm">
          <CardHeader className="flex flex-col items-center gap-3 pb-8 pt-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
            <div className="space-y-1.5">
              <CardTitle className="text-lg font-semibold tracking-tight">
                Signing you in
              </CardTitle>
              <CardDescription className="px-3 text-sm leading-relaxed">
                Verifying your Zeva Clinic session, please wait a moment...
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default SSOCallback;

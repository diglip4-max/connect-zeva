import { Link, useNavigate } from "react-router-dom";
import { Loader2, MessageSquare, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

import { useAuth } from "@/context/AuthContext";
import { loginWithPassword } from "@/api/auth.api";
import { importUsersFromZevaClinic } from "@/api/user.api";

// Zod schema for validation
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Initialize react-hook-form
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isValid },
    trigger,
    clearErrors,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur", // Validate on blur for better UX
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    setIsLoading(true);

    try {
      const {
        success,
        message,
        data: { accessToken, user },
      } = await loginWithPassword(values.email, values.password);
      if (!success) {
        throw new Error(message);
      }

      login(accessToken, user);

      //   import users from clinic
      const userList = await importUsersFromZevaClinic(accessToken);
      console.log({ userList });
      navigate("/", { replace: true });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        "Invalid email or password. Please try again.";

      // Smart error handling - map server errors to specific fields
      if (
        message.toLowerCase().includes("email") ||
        message.toLowerCase().includes("not found")
      ) {
        setError("email", {
          type: "server",
          message: "No account found with this email",
        });
      } else if (
        message.toLowerCase().includes("password") ||
        message.toLowerCase().includes("incorrect")
      ) {
        setError("password", {
          type: "server",
          message: "Incorrect password",
        });
      } else {
        setServerError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Clear field errors when user starts typing
  const handleFieldChange = (field: keyof LoginFormValues) => {
    return (value: string) => {
      if (errors[field]) {
        clearErrors(field);
      }
      if (serverError) {
        setServerError(null);
      }
      console.log({ value });
    };
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo and brand */}
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
            <MessageSquare className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            Zeva Connect
          </span>
        </div>

        <Card className="border-border/40 bg-card/80 shadow-xl shadow-black/[0.03] backdrop-blur-sm">
          <CardHeader className="space-y-1.5 pb-4 pt-8 text-center">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Welcome back
            </CardTitle>
            <CardDescription className="text-sm">
              Sign in with your email and password
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-8">
            <form id="login-form" onSubmit={handleSubmit(onSubmit)}>
              <FieldGroup>
                {/* Email Field */}
                <Controller
                  name="email"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="login-email">Email</FieldLabel>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          {...field}
                          id="login-email"
                          type="email"
                          placeholder="you@clinic.com"
                          className={`pl-9 ${fieldState.invalid ? "border-destructive" : ""}`}
                          autoFocus
                          disabled={isLoading}
                          aria-invalid={fieldState.invalid}
                          onChange={(e) => {
                            field.onChange(e);
                            handleFieldChange("email")(e.target.value);
                          }}
                          onBlur={() => {
                            field.onBlur();
                            trigger("email");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              (
                                document.getElementById(
                                  "login-form",
                                ) as HTMLFormElement
                              )?.requestSubmit();
                            }
                          }}
                        />
                      </div>
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* Password Field */}
                <Controller
                  name="password"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <div className="flex items-center justify-between">
                        <FieldLabel htmlFor="login-password">
                          Password
                        </FieldLabel>
                        <Link
                          to="/auth/forgot-password"
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          {...field}
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className={`pl-9 pr-9 ${fieldState.invalid ? "border-destructive" : ""}`}
                          disabled={isLoading}
                          aria-invalid={fieldState.invalid}
                          onChange={(e) => {
                            field.onChange(e);
                            handleFieldChange("password")(e.target.value);
                          }}
                          onBlur={() => {
                            field.onBlur();
                            trigger("password");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              (
                                document.getElementById(
                                  "login-form",
                                ) as HTMLFormElement
                              )?.requestSubmit();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* Server error (non-field specific) */}
                {serverError && (
                  <div className="rounded-md bg-destructive/10 px-3 py-2">
                    <p className="text-sm text-destructive">{serverError}</p>
                  </div>
                )}

                {/* Form-level errors from useForm */}
                {errors.root && (
                  <div className="rounded-md bg-destructive/10 px-3 py-2">
                    <p className="text-sm text-destructive">
                      {errors.root.message}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full shadow-sm"
                  disabled={isLoading || isSubmitting || !isValid}
                >
                  {isLoading || isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>

                {/* Field count indicator */}
                <div className="mt-2 text-xs text-muted-foreground">
                  {Object.keys(errors).length > 0 && (
                    <p>
                      {Object.keys(errors).length} field
                      {Object.keys(errors).length > 1 ? "s" : ""} need attention
                    </p>
                  )}
                </div>
              </FieldGroup>
            </form>

            {/* Sign up link */}
            <p className="mt-5 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/auth/signup"
                className="font-medium text-primary hover:underline"
              >
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Secured by Zeva Clinic single sign-on
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

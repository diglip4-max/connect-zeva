import { useNavigate } from "react-router-dom";
import { LogOut, User, Bell, Palette, Shield, ChevronLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/formatDate";
import DeviceList from "@/components/settings/DeviceList";
import ThemeSelector from "@/components/settings/ThemeSelector";

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/auth/login", { replace: true });
  };

  if (!user) return null;

  return (
    <div className="h-full overflow-y-auto px-4 py-6 sm:px-10 sm:py-8">
      {/* Mobile back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground md:hidden"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage your profile, notifications, and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile card */}
        <section className="rounded-2xl border border-border/60 bg-card/40 p-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-background">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-lg font-medium text-primary">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold tracking-tight">
                {user.name}
              </p>
              <p className="mt-0.5 text-sm capitalize text-muted-foreground">
                {user.role}
              </p>
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <Shield className="h-3 w-3" />
                Managed by Zeva Clinic
              </span>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="rounded-2xl border border-border/60 bg-card/40 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Appearance</h2>
          </div>
          <ThemeSelector />
        </section>

        {/* Notifications / Devices */}
        <section className="rounded-2xl border border-border/60 bg-card/40 p-5">
          <div className="mb-1 flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Notification Devices</h2>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            Browsers and devices currently receiving push notifications for new
            messages.
          </p>
          <DeviceList />
        </section>

        {/* Account */}
        <section className="rounded-2xl border border-border/60 bg-card/40 p-5">
          <div className="mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Account</h2>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            Your account is managed through Zeva Clinic. To update your name,
            role, or profile picture, contact your clinic administrator.
          </p>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full justify-center gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;

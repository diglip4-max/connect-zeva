// src/components/layout/Header.tsx
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Settings,
  MessageSquare,
  Menu,
  // Search
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSocketContext } from "@/context/SocketContext";
import { useUIStore } from "@/store/uiStore";
import ThemeToggle from "@/components/common/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import React from "react";
import GlobalSearchDialog from "../chat/GlobalSearchDialog";

function getInitials(name: string) {
  return name
    ?.trim()
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const Header = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocketContext();
  const navigate = useNavigate();
  const toggleMobileSidebar = useUIStore((s) => s.toggleMobileSidebar);

  const [isOpenGlobalSearchModal, setIsOpenGlobalSearchModal] =
    React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/auth/login", { replace: true });
  };

  if (!user) return null;

  return (
    <header className="flex h-16 items-center justify-between border-b border-border/60 bg-card/50 px-3 backdrop-blur-sm md:px-4">
      {/* Left: Hamburger (mobile only) + Brand */}
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0 md:hidden"
          onClick={toggleMobileSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <MessageSquare className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="truncate text-sm font-semibold tracking-tight">
          Zeva Connect
        </span>

        {/* connection status indicator - text hidden on very small screens */}
        <span
          className={`ml-1 hidden shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs sm:flex ${
            isConnected
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isConnected ? "bg-emerald-500" : "bg-muted-foreground"
            }`}
          />
          {isConnected ? "Connected" : "Connecting..."}
        </span>
        {/* mobile ke liye - sirf dot, text nahi */}
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full sm:hidden ${
            isConnected ? "bg-emerald-500" : "bg-muted-foreground"
          }`}
        />
      </div>

      {/* Right: Theme toggle + user menu */}
      <div className="flex shrink-0 items-center gap-1 md:gap-2">
        {/* <Button
          onClick={() => setIsOpenGlobalSearchModal(true)}
          variant="ghost"
          size="icon"
        >
          <Search className="h-5 w-5 transition-all" />
        </Button> */}

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="flex items-center gap-2 rounded-full p-0.5 outline-none ring-offset-background transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs font-normal capitalize text-muted-foreground">
                  {user.role}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
            </DropdownMenuGroup>

            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Global Search Dialog */}
      <GlobalSearchDialog
        open={isOpenGlobalSearchModal}
        onOpenChange={setIsOpenGlobalSearchModal}
      />
    </header>
  );
};

export default Header;

// src/components/layout/Sidebar.tsx
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/chat", label: "Chat", icon: MessageSquare },
];

const Sidebar = () => {
  const isCollapsed = useUIStore((s) => s.isSidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-sidebar transition-[width] duration-200 ease-in-out",
        isCollapsed ? "w-[68px]" : "w-60",
      )}
    >
      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-1 px-2.5 pt-3">
        {navItems.map((item) => {
          const navLinkContent = (
            <NavLink
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150",
                  isCollapsed ? "h-11 w-11 justify-center" : "h-10 px-3",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* active indicator bar - sirf expanded me */}
                  {isActive && !isCollapsed && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                  )}
                  <item.icon
                    className={cn(
                      "shrink-0 transition-transform",
                      isCollapsed ? "h-[18px] w-[18px]" : "h-4.5 w-4.5",
                    )}
                  />
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </>
              )}
            </NavLink>
          );

          return (
            <Tooltip key={item.to}>
              <TooltipTrigger>{navLinkContent}</TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" sideOffset={12}>
                  {item.label}
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </nav>

      {/* Collapse toggle button */}
      <div className="px-2.5 pb-3 pt-2">
        <Tooltip>
          <TooltipTrigger className="w-full">
            <Button
              variant="ghost"
              onClick={toggleSidebar}
              className={cn(
                "flex items-center text-sidebar-foreground/60 hover:text-sidebar-foreground",
                isCollapsed
                  ? "h-11 w-11 justify-center p-0"
                  : "h-10 w-full justify-start gap-3 px-3",
              )}
            >
              {isCollapsed ? (
                <ChevronsRight className="h-[18px] w-[18px]" />
              ) : (
                <>
                  <ChevronsLeft className="h-4.5 w-4.5" />
                  <span className="text-sm font-medium">Collapse</span>
                </>
              )}
            </Button>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right" sideOffset={12}>
              Expand sidebar
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </aside>
  );
};

export default Sidebar;

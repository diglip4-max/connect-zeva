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
  const isMobileSidebarOpen = useUIStore((s) => s.isMobileSidebarOpen);
  const closeMobileSidebar = useUIStore((s) => s.closeMobileSidebar);

  const sidebarContent = (
    <>
      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-1 px-2.5 pt-3">
        {navItems.map((item) => {
          const navLinkContent = (
            <NavLink
              to={item.to}
              end={item.to === "/"}
              onClick={closeMobileSidebar} // mobile pe link click hote hi drawer band ho jaye
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150",
                  isCollapsed
                    ? "md:h-11 md:w-11 md:justify-center"
                    : "h-10 px-3",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && !isCollapsed && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                  )}
                  <item.icon
                    className={cn(
                      "shrink-0 transition-transform",
                      isCollapsed
                        ? "h-[18px] w-[18px] md:h-[18px] md:w-[18px]"
                        : "h-4.5 w-4.5",
                    )}
                  />
                  {/* mobile pe label hamesha dikhega (drawer wide hai), desktop pe collapse-state se control hota hai */}
                  <span className={cn("truncate", isCollapsed && "md:hidden")}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );

          // mobile pe tooltip ki zaroorat nahi (label already visible hai drawer me)
          return (
            <Tooltip key={item.to}>
              <TooltipTrigger className="md:contents">
                {navLinkContent}
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent
                  side="right"
                  sideOffset={12}
                  className="hidden md:block"
                >
                  {item.label}
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </nav>

      {/* Collapse toggle button - sirf desktop pe, mobile drawer me collapse concept nahi hota */}
      <div className="hidden px-2.5 pb-3 pt-2 md:block">
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
    </>
  );

  return (
    <>
      {/* Mobile overlay backdrop - sirf tab dikhta hai jab drawer open ho */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Desktop sidebar - normal, collapse/expand ke saath, hamesha visible */}
      <aside
        className={cn(
          "hidden h-full flex-col bg-sidebar transition-[width] duration-200 ease-in-out md:flex",
          isCollapsed ? "md:w-[68px]" : "md:w-60",
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar - drawer, slide-in from left, overlay ke upar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar shadow-xl transition-transform duration-200 ease-in-out md:hidden",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;

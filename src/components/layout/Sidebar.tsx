import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Upload,
  Video,
  Play,
  Settings,
  LogOut,
  Loader,
} from "lucide-react";

type SidebarProps = {
  className?: string;
};

type NavItemProps = {
  icon: React.ElementType;
  label: string;
  href?: string;
  active?: boolean;
  onClick?: () => void;
  collapsed?: boolean;
};

const NavItem = ({ icon: Icon, label, href, active, onClick, collapsed }: NavItemProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      {href ? (
        <Link to={href} onClick={onClick}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 text-gray-500 hover:text-primary hover:bg-gray-100",
              active && "text-primary bg-gray-100",
              collapsed ? "px-3" : "px-4"
            )}
          >
            <Icon size={20} />
            {!collapsed && <span>{label}</span>}
          </Button>
        </Link>
      ) : (
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-gray-500 hover:text-primary hover:bg-gray-100",
            active && "text-primary bg-gray-100",
            collapsed ? "px-3" : "px-4"
          )}
          onClick={onClick}
        >
          <Icon size={20} />
          {!collapsed && <span>{label}</span>}
        </Button>
      )}
    </TooltipTrigger>
    {collapsed && <TooltipContent side="right">{label}</TooltipContent>}
  </Tooltip>
);

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div
      className={cn(
        "border-r h-screen bg-white flex flex-col transition-all duration-300 ease-in-out",
        collapsed ? "w-[64px]" : "w-[240px]",
        className
      )}
    >
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <h1 className="text-lg font-heading font-bold text-primary">LectureAI</h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight size={20} />
          ) : (
            <ChevronLeft size={20} />
          )}
        </Button>
      </div>
      
      <div className="flex flex-col gap-1 p-2 flex-1">
        <NavItem
          icon={LayoutDashboard}
          label="Dashboard"
          href="/dashboard"
          active={isActive("/dashboard")}
          collapsed={collapsed}
        />
        <NavItem
          icon={Upload}
          label="Upload"
          href="/upload"
          active={isActive("/upload")}
          collapsed={collapsed}
        />
        <NavItem
          icon={Video}
          label="My Videos"
          href="/videos"
          active={isActive("/videos")}
          collapsed={collapsed}
        />

      </div>
      
      <div className="mt-auto border-t p-2">
        <NavItem
          icon={Settings}
          label="Settings"
          href="/settings"
          active={isActive("/settings")}
          collapsed={collapsed}
        />
        <NavItem
          icon={LogOut}
          label="Log Out"
          onClick={handleSignOut}
          collapsed={collapsed}
        />
      </div>
    </div>
  );
}

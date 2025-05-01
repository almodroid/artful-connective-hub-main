
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Laptop, Users, Flag, Settings, Home, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

export function AdminSidebar() {
  const location = useLocation();
  const { t, isRtl } = useTranslation();
  
  const navItems = [
    {
      label: "لوحة التحكم",
      href: "/admin",
      icon: <Laptop className="h-4 w-4" />,
      active: location.pathname === "/admin"
    },
    {
      label: "المستخدمين",
      href: "/admin/users",
      icon: <Users className="h-4 w-4" />,
      active: location.pathname === "/admin/users"
    },
    {
      label: "البلاغات",
      href: "/admin/reports",
      icon: <Flag className="h-4 w-4" />,
      active: location.pathname === "/admin/reports"
    },
    {
      label: "الإشعارات",
      href: "/admin/notifications",
      icon: <Bell className="h-4 w-4" />,
      active: location.pathname === "/admin/notifications"
    },
    {
      label: "الإعدادات",
      href: "/admin/settings",
      icon: <Settings className="h-4 w-4" />,
      active: location.pathname === "/admin/settings"
    }
  ];
  
  return (
    <aside className={cn(
      "w-64 min-h-screen flex-shrink-0 flex-col fixed top-0 bottom-0 bg-card",
      isRtl ? "right-0 border-l" : "left-0 border-r",
      "dark:border-l-0 dark:border-r-0"
    )}>
      <div className="p-6">
        <Link 
          to="/"
          className="inline-flex items-center justify-center gap-2 text-primary font-bold text-xl"
        >
          <Home className="h-5 w-5" />
          <span>المنصة</span>
        </Link>
      </div>
      
      <Separator />
      
      <nav className="flex flex-col gap-2 p-4">
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant={item.active ? "default" : "ghost"}
            className={cn(
              "justify-start gap-3 h-10",
              item.active && "bg-primary text-primary-foreground"
            )}
            asChild
          >
            <Link to={item.href}>
              {item.icon}
              <span>{item.label}</span>
            </Link>
          </Button>
        ))}
      </nav>
    </aside>
  );
}

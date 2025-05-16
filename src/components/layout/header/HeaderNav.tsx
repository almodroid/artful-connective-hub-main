
import { Link } from "react-router-dom";
import { Home, Search, PlusSquare, Wand, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  hiddenMobile?: boolean;
}

export function HeaderNav() {
  const { t, isRtl } = useTranslation();
  const isMobile = useIsMobile();
  
  const navItems: NavItem[] = [
    {
      label: t("home"),
      href: "/",
      icon: <Home className="h-5 w-5 mx-2" />
    },
    {
      label: t("explore"),
      href: "/explore",
      icon: <Search className="h-5 w-5 mx-2" />
    },
    {
      label: t("projects"),
      href: "/projects",
      icon: <PlusSquare className="h-5 w-5 mx-2" />
    },
    {
      label: t("messages"),
      href: "/messages",
      icon: <MessageSquare className="h-5 w-5 mx-2" />
    },
    {
      label: "Space Ai",
      href: "/arter",
      icon: <Wand className="h-5 w-5 mx-2" />
    }
  ];
  
 

return (
    <nav className={`mx-6 flex items-center space-x-4 sm:space-x-6`}>
      {navItems.map((item) => item.hiddenMobile ? (
        <Button 
          key={item.href}
          variant="ghost" 
          asChild
          className="hidden sm:flex items-center"
        >
          <Link to={item.href}>
            <span className={`flex items-center`}>
              {item.icon}
              <span className="hidden lg:inline">{item.label}</span>
            </span>
          </Link>
        </Button>
      ) : (
        <Button 
          key={item.href}
          variant="ghost" 
          asChild
          className="flex items-center"
        >
          <Link to={item.href}>
            <span className={`flex items-center`}>
              {item.icon}
              <span className="hidden lg:inline">{item.label}</span>
            </span>
          </Link>
        </Button>
      ))}
    </nav>
  );
}

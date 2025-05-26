import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { Home, Search, PlusSquare, Bell, User, FolderKanban, Plus, MessageSquare, Wand } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function BottomBar() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const {t, isRtl } = useTranslation();

  const navigation = [
    { name: t("home"), href: "/", icon: Home },
    { name: t("explore"), href: "/explore", icon: Search },
    { name: t("projects"), href: "/projects", icon: FolderKanban },
    { name: t("messages"), href: "/messages", icon: MessageSquare },
    { name: t("Space Ai"), href: "/space-ai", icon: Wand},
  ];

  if (!isAuthenticated) {
    const navigation = [
      { name: t("home"), href: "/", icon: Home },
      { name: t("explore"), href: "/explore", icon: Search },
      { name: t("projects"), href: "/projects", icon: FolderKanban },
      { name: t("Space Ai"), href: "/space-ai", icon: Wand},
      
    ];
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
      {!location.pathname.startsWith('/reel/') && (
      <div className="flex h-16 items-center justify-around px-4">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-foreground",
              location.pathname === item.href && "text-foreground"
            )}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs">{item.name}</span>
          </Link>
        ))}
        
        
          <Link
            to={isAuthenticated ? "/create" : "/login"}
            className="fixed right-4 bottom-20 z-50"
          >
            <Button size="icon" variant="default" className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow">
              <Plus className="h-6 w-6" />
            </Button>
          </Link>
      </div>
      )}
    </nav>
    );
  }
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {!location.pathname.startsWith('/reel/') && (
      <div className="flex h-16 items-center justify-around px-4">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-foreground",
              location.pathname === item.href && "text-foreground"
            )}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs">{item.name}</span>
          </Link>
        ))}
          <Link
            to={isAuthenticated ? "/create" : "/login"}
            className="fixed right-4 bottom-20 z-50"
          >
            <Button size="icon" variant="default" className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow">
              <Plus className="h-6 w-6" />
            </Button>
          </Link>
      </div>
      )}
    </nav>
  );
}
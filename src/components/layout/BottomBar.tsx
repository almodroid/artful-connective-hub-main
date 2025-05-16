import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { Home, Search, PlusSquare, Bell, User, FolderKanban, Plus, MessageSquare } from "lucide-react";
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
  ];

  if (!isAuthenticated) {
    const navigation = [
      { name: t("home"), href: "/", icon: Home },
      { name: t("explore"), href: "/explore", icon: Search },
      { name: t("projects"), href: "/projects", icon: FolderKanban },
      { name: t("login"), href: "/login", icon: User},
    ];
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
        

        

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <span className="text-xs">Profile</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" side="top">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      )}
    </nav>
  );
}
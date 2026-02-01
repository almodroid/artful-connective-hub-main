import { Link, useNavigate } from "react-router-dom";
import { User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/use-translation";
import NotificationsDropdown from "../../notifications/NotificationsDropdown";
import { useIsMobile } from "@/hooks/use-mobile";

export function UserMenu() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const { t, isRtl } = useTranslation();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (loading) {
    // Optionally, show a spinner here instead of null
    return null;
  }

  if (!isAuthenticated && !isMobile) {
    return (
      <>
        <Button variant="ghost" asChild>
          <Link to="/login">{t("login")}</Link>
        </Button>
        <Button asChild>
          <Link to="/register">{t("register")}</Link>
        </Button>
      </>
    );
  }

  if (isMobile && !isAuthenticated) {
    return (
      <>
        <Link to="/login">
          <User className="rounded-full bg-gray-900 p-2 w-8 h-8 mx-2 text-white dark:text-white" />
        </Link>
      </>
    );
  }


  return (
    <>
      {!isMobile}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full mt-1 mr-2">
            <Avatar className="h-8 w-8 border overflow-hidden">
              <AvatarImage
                src={user?.avatar}
                alt={user?.displayName}
                className="object-cover"
              />
              <AvatarFallback>{user?.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-56" >
          <DropdownMenuLabel className="font-normal" dir={isRtl ? "rtl" : "ltr"}>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                @{user?.username}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to={`/profile/${user?.username}`} className="cursor-pointer w-full text-right hover:text-primary" dir={isRtl ? "rtl" : "ltr"}>
              <User className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'} float-right`} />
              <span>{t("profile")}</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/edit-profile" className="cursor-pointer w-full text-right hover:text-primary" dir={isRtl ? "rtl" : "ltr"}>
              <Settings className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'} float-right`} />
              <span>{t("settings")}</span>
            </Link>
          </DropdownMenuItem>
          {user?.isAdmin && (
            <DropdownMenuItem asChild>
              <Link to="/admin" className="cursor-pointer w-full text-right hover:text-primary" dir={isRtl ? "rtl" : "ltr"}>
                <Settings className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'} float-right`} />
                <span>{t("adminPanel")}</span>
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:text-destructive text-right w-full text-red-600 dark:text-red-400 hover:text-destructive hover:text-red-400 dark:hover:text-red-200 focus:outline-none focus:ring-0"
            onClick={handleLogout}
            dir={isRtl ? "rtl" : "ltr"}
          >
            <LogOut className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'} float-right`} />
            <span>{t("logout")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

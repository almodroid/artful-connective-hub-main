import { MobileMenu } from "./header/MobileMenu";
import { Logo } from "./header/Logo";
import { HeaderNav } from "./header/HeaderNav";
import { UserMenu } from "./header/UserMenu";
import { DesktopActions } from "./header/DesktopActions";
import { useTranslation } from "@/hooks/use-translation";
import { Link, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import NotificationsDropdown from "@/components/notifications/NotificationsDropdown";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, ArrowRight } from "lucide-react";


export function Header() {
  const { t, isRtl } = useTranslation();
  const isMobile = useIsMobile();
  const { user, logout, isAuthenticated } = useAuth();

  if (isMobile) {
    const location = useLocation();
    const isHome = location.pathname === "/";
    
    return (
      <>
      <div className={`flex items-center justify-between`}>
        <div>
        {!isHome && (
          <button 
            onClick={() => window.history.back()}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ml-[30px]"
          >
            {isRtl ? (
                <ArrowRight className="h-6 w-6" />
              ) : (
                <ArrowLeft className="h-6 w-6" />
              )}
           
          </button>
        )}
        </div>
        <div className={`flex items-center ${isHome ? 'ml-[-70px]' : ''}`}>
          <Logo /> <Link to="/" className={` sm:block ${isRtl ? 'ml-1' : 'mr-1'}`}>{t('spaceArt')}</Link>
        </div>
        <div className="flex items-center justify-center">
        <DesktopActions />
        {isAuthenticated && <NotificationsDropdown />}
        </div>
        
      </div>
      
      </>
    );
  }
  
  return (
    <header className="border-b fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-6 lg:px-8">
        <div className={`flex items-center gap-2 ${isRtl ? 'ml-auto' : 'mr-auto'}`}>
          <Logo /> <Link to="/" className={`hidden sm:block ${isRtl ? 'ml-4' : 'mr-4'}`}>{t('spaceArt')}</Link>
        </div>
          <HeaderNav />
        <div className="flex items-center gap-2">
          <DesktopActions />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

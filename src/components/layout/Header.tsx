import { MobileMenu } from "./header/MobileMenu";
import { Logo } from "./header/Logo";
import { UserMenu } from "./header/UserMenu";
import { DesktopActions } from "./header/DesktopActions";
import { useTranslation } from "@/hooks/use-translation";
import { Link, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, ArrowRight } from "lucide-react";


export function Header() {
  const { t, isRtl } = useTranslation();
  const isMobile = useIsMobile();
  const { user, isAuthenticated } = useAuth();

  if (isMobile) {
    const location = useLocation();
    const isHome = location.pathname === "/";

    return (
      <>
        <div className={`flex items-center justify-between`}>
          <div className="flex">
            {!isHome && (
              <button
                onClick={() => window.history.back()}
                className="px-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 "
              >
                {isRtl ? (
                  <ArrowRight className="h-6 w-6" />
                ) : (
                  <ArrowLeft className="h-6 w-6" />
                )}

              </button>
            )}
            <UserMenu />
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
            <Logo /> <Link to="/" className={` sm:block ${isRtl ? 'ml-1' : 'mr-1'}`}></Link>
          </div>
          <div className="flex items-center justify-center">
            <DesktopActions />
          </div>
        </div>

      </>
    );
  }

  return (
    <header className="border-b fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        <div className={`flex items-center`}>
          <Logo /> <Link to="/" className={`hidden sm:block`}></Link>
        </div>
        <div className="flex items-center gap-2">
          <DesktopActions />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

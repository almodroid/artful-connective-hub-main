import { MobileMenu } from "./header/MobileMenu";
import { Logo } from "./header/Logo";
import { HeaderNav } from "./header/HeaderNav";
import { UserMenu } from "./header/UserMenu";
import { DesktopActions } from "./header/DesktopActions";
import { useTranslation } from "@/hooks/use-translation";
import { Link } from "react-router-dom";


export function Header() {
  const { t, isRtl } = useTranslation();
  
  return (
    <header className="border-b fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-6 lg:px-8">
        <div className={`flex items-center gap-2 ${isRtl ? 'ml-auto' : 'mr-auto'}`}>
          <MobileMenu/>
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

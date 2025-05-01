import { MobileMenu } from "./header/MobileMenu";
import { Logo } from "./header/Logo";
import { HeaderNav } from "./header/HeaderNav";
import { UserMenu } from "./header/UserMenu";
import { DesktopActions } from "./header/DesktopActions";
import { useTranslation } from "@/hooks/use-translation";

export function Header() {
  const { isRtl } = useTranslation();
  
  return (
    <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-6 lg:px-8">
        <div className={`flex items-center gap-2 ${isRtl ? 'ml-auto' : 'mr-auto'}`}>
          <MobileMenu/>
          <Logo />
        </div>
        
        <HeaderNav />
        
        <div className="flex items-center gap-2">
          <UserMenu />
          <DesktopActions />
        </div>
      </div>
    </header>
  );
}

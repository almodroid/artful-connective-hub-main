
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Footer } from "./Footer";
import { BottomBar } from "./BottomBar";
import { useTranslation } from "@/hooks/use-translation";
import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";
import { Header } from "./Header";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
  fullBleed?: boolean;
  hideSidebars?: boolean;
  forceDarkMode?: boolean;
  hideHeader?: boolean;
  hideBottomBar?: boolean;
}

export function Layout({ children, hideFooter = false, fullBleed = false, hideSidebars = false, forceDarkMode = false, hideHeader = false, hideBottomBar = false }: LayoutProps) {
  const location = useLocation();
  const { isRtl } = useTranslation();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (forceDarkMode) {
      setTheme('dark');
    }
    // Scroll to top on route change
    window.scrollTo(0, 0);
    
    // Update the HTML dir attribute for global RTL/LTR
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    if (isRtl) {
      document.documentElement.classList.add("rtl");
      document.documentElement.classList.remove("ltr");
    } else {
      document.documentElement.classList.add("ltr");
      document.documentElement.classList.remove("rtl");
    }
  }, [location.pathname, isRtl, forceDarkMode, setTheme]);

  return (
    <div className="flex min-h-screen flex-col" dir={isRtl ? "rtl" : "ltr"}>
      {!hideHeader && <Header />}
      <div className={cn("flex min-h-screen", !hideHeader && "mt-16")}>
        {!hideSidebars && <LeftSidebar />}
        <main className={cn("flex-1", (fullBleed && hideHeader && !hideBottomBar) ? "py-16" : "", !fullBleed && !hideSidebars && "py-4 container max-w-screen-xl px-2 sm:px-3 lg:px-4")}>
          {children}
        </main>
        {!hideSidebars && <RightSidebar />}
      </div>
      {/* Only show Footer on md and up */}
      {!hideFooter && <div className="hidden md:block"><Footer /></div>}
      {!hideBottomBar && <BottomBar />}
    </div>
  );
}

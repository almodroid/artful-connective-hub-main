
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { BottomBar } from "./BottomBar";
import { useTranslation } from "@/hooks/use-translation";

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
  fullBleed?: boolean;
}

export function Layout({ children, hideFooter = false, fullBleed = false }: LayoutProps) {
  const location = useLocation();
  const { isRtl } = useTranslation();
  
  // Scroll to top on route change
  useEffect(() => {
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
  }, [location.pathname, isRtl]);

  return (
    <div className="flex min-h-screen flex-col" dir={isRtl ? "rtl" : "ltr"}>
      <div className=" md:block md:mb-12 ">
        <Header />
      </div>
      <main className={fullBleed ? "flex-1" : "flex-1 container px-4 md:px-8 py-6 pb-24 md:py-12"}>
        {children}
      </main>
      {/* Only show Footer on md and up */}
      {!hideFooter && <div className="hidden md:block"><Footer /></div>}
      <BottomBar />
    </div>
  );
}

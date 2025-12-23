
import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Home, Search, PlusSquare, Wand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { useTranslation } from "@/hooks/use-translation";

export function MobileMenu() {
  const { t, isRtl } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    {
      label: t("home"),
      href: "/",
      icon: <Home className="h-5 w-5 mr-2" />
    },
    {
      label: t("explore"),
      href: "/explore",
      icon: <Search className="h-5 w-5 mr-2" />
    },
    {
      label: t("projects"),
      href: "/projects",
      icon: <PlusSquare className="h-5 w-5 mr-2" />
    },
    {
      label: t("spaceAI"),
      href: "/space-ai",
      icon: <Wand className="h-5 w-5 mr-2" />
    }
  ];

  return (
    <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <SheetTrigger asChild className="sm:hidden">
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side={isRtl ? "right" : "left"} className="w-[300px] sm:w-[400px]">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between py-4">
            <span className="text-lg font-medium">القائمة</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                className="justify-start gap-4 h-12"
                asChild
                onClick={() => setIsMenuOpen(false)}
              >
                <Link to={item.href}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </Button>
            ))}
          </nav>

          <div className="mt-auto py-4">
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

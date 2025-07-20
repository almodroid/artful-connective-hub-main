
import React from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/hooks/use-translation";
import { Check } from "lucide-react";

export function LanguageSwitcher() {
  const { language, changeLanguage, t, isRtl } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => changeLanguage("en")}
          className={`${language === "en" ? "bg-accent" : ""} ${isRtl ? "direction-rtl" : ""} flex justify-between items-center`}
          dir={isRtl ? "rtl" : "ltr"}
        >
          <span>English</span>
          {language === 'en' && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeLanguage("ar")}
          className={`${language === "ar" ? "bg-accent" : ""} ${isRtl ? "direction-rtl" : ""} flex justify-between items-center`}
          dir={isRtl ? "rtl" : "ltr"}
        >
          <span>العربية</span>
          {language === 'ar' && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="w-9 h-9 opacity-0" />;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="w-9 h-9 rounded-full transition-all hover:bg-background/80 hover:text-primary"
      aria-label={theme === 'dark' ? 'تبديل إلى وضع النهار' : 'تبديل إلى وضع الليل'}
    >
      <Sun className={`h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-300 ${theme === 'dark' ? 'opacity-0 scale-0' : 'opacity-100'}`} />
      <Moon className={`absolute h-[1.2rem] w-[1.2rem] rotate-90 transition-all duration-300 ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 scale-0'}`} />
    </Button>
  );
}


import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/use-translation";
import { useTheme } from "@/contexts/ThemeContext";

export function Logo() {
  const { isRtl } = useTranslation();
  const { theme } = useTheme();
  
  return (
    <Link to="/" className={`hidden sm:block ${isRtl ? 'ml-4' : 'mr-4'}`}>
      <img 
        src={theme === 'light' ? '/assets/logolight.png' : '/assets/logo.png'}
        alt="Artful Connective Hub Logo" 
        className="h-12 w-auto object-contain"
      />
    </Link>
  );
}

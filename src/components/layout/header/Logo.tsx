
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/use-translation";
import { useTheme } from "@/contexts/ThemeContext";

// Accept className as prop
export function Logo({ className = "" }: { className?: string }) {
  const { isRtl } = useTranslation();
  const { theme } = useTheme();
  
  return (
    <Link to="/" className={`${isRtl ? 'ml-4' : 'mr-4'} sm:block flex justify-center`}>
      <img 
        src={theme === 'light' ? '/assets/logolight.png' : '/assets/logo.png'}
        alt="Artful Connective Hub Logo" 
        className={`h-12 w-auto object-contain ${className}`}
      />
    </Link>
  );
}

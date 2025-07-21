
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/use-translation";
import { useTheme } from "@/contexts/ThemeContext";

// Accept className as prop
export function Logo({ className = "" }: { className?: string }) {
  const { isRtl } = useTranslation();
  const { theme } = useTheme();
  
  return (
    <Link to="/" className={`sm:block flex justify-center ${isRtl ? 'sm:ml-4' : 'sm:mr-4'} mx-auto`}>
      <img 
        src={theme === 'light' ? '/assets/logolight.png' : '/assets/logo.png'}
        alt="Artful Connective Hub Logo" 
        className={`h-12 w-auto object-contain ${className}`}
      />
    </Link>
  );
}

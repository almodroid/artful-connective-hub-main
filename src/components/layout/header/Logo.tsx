
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/use-translation";
import { useTheme } from "@/contexts/ThemeContext";

// Accept className as prop
export function Logo({ className = "", link = true }: { className?: string, link?: boolean }) {
  const { isRtl } = useTranslation();
  const { theme } = useTheme();

  return (
    link ? <Link to="/" className={`sm:block flex justify-center ${isRtl ? 'sm:ml-4' : 'sm:mr-4'} mx-auto`}>
      <img
        src='/assets/logo.png'
        alt="Artspace Logo"
        className={`h-12 w-auto object-contain ${className}`}
      />
    </Link> : <img
      src='/assets/logo.png'
      alt="Artspace Logo"
      className={`h-12 w-auto object-contain ${className}`}
    />
  );
}


import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/use-translation";

export function Logo() {
  const { isRtl } = useTranslation();
  
  return (
    <Link to="/" className={`font-bold text-xl hidden sm:block text-primary ${isRtl ? 'ml-4' : 'mr-4'}`}>
      منصة الفنون
    </Link>
  );
}

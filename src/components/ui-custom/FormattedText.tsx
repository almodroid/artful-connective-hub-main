
import { renderFormattedText } from "@/utils/textParser";
import { useTranslation } from "@/hooks/use-translation";

interface FormattedTextProps {
  text: string;
  className?: string;
  forceDirection?: boolean;
}

export function FormattedText({ 
  text, 
  className = "", 
  forceDirection = true 
}: FormattedTextProps) {
  const { isRtl } = useTranslation();
  const formattedElements = renderFormattedText(text);
  
  // Check if text contains Arabic characters to set RTL
  const containsArabic = /[\u0600-\u06FF]/.test(text);
  const textDirection = containsArabic ? "rtl" : "ltr";
  
  // Use either detected direction or forced direction based on current language
  const direction = forceDirection ? (isRtl ? "rtl" : "ltr") : textDirection;
  
  return (
    <div 
      className={`whitespace-pre-line ${className}`} 
      dir={direction}
    >
      {formattedElements}
    </div>
  );
}


import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/use-translation";

export function Footer() {
  const { t, isRtl } = useTranslation();
  return (
    <footer className="border-t py-12 mt-20">
      <div className="container px-4 md:px-8">
        <div className="mt-10 pt-6 border-t text-center text-muted-foreground flex items-center justify-between">
          <p>{t("footerCopyright")}</p>
          <div className={`flex flex-wrap justify-center gap-4  ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Link to="/privacy-policy" className="hover:underline">{t("privacyPolicy")}</Link>
            <Link to="/terms-and-conditions" className="hover:underline">{t("termsOfService")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

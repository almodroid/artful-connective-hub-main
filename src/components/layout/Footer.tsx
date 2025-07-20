
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/use-translation";
import { Logo } from "./header/Logo";



export function Footer() {
  const { t, isRtl } = useTranslation();
  return (
    <footer className="border-t py-12 mt-20">
      <div className="container px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center align-center gap-1 mb-4">
              <div className="relative h-14">
              <Logo  />
              </div>
              <span className="font-display font-bold text-xl">
              {t('spaceArt')}
              </span>
            </div>
            <p className="text-muted-foreground">
              {t('footerDescription')}
            </p>
          </div>
          <div>
            <h4 className="font-display font-bold text-lg mb-4">{t('footerLinksTitle')}</h4>
            <ul className="space-y-2 ">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('home')}
                </Link>
              </li>
              <li>
                <Link to="/explore" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('explore')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('aboutUs')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold text-lg mb-4">{t('contactUs')}</h4>
            <p className="text-muted-foreground mb-2">
              {t('forQuestions')}: support@artspacee.com
            </p>
            <div className="flex space-x-4 rtl:space-x-reverse mt-4">
              <a href="#" className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary hover:bg-primary/10 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"></path>
                </svg>
              </a>
              <a href="#" className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary hover:bg-primary/10 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z"></path>
                </svg>
              </a>
              <a href="#" className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary hover:bg-primary/10 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3Z"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
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

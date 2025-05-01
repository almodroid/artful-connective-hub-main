
import { ThemeToggle } from "../ThemeToggle";
import { LanguageSwitcher } from "../LanguageSwitcher";

export function DesktopActions() {
  return (
    <div className="hidden sm:flex items-center gap-2">
      <ThemeToggle />
      <LanguageSwitcher />
    </div>
  );
}

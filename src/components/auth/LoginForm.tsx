
import { useState } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";

export function LoginForm() {
  const { login, loading, signInWithProvider } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t, isRtl } = useTranslation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isEmail, setIsEmail] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [dialogEmail, setDialogEmail] = useState("");
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password.trim()) {
      setError(t("fillAllFields"));
      return;
    }

    setIsEmail(identifier.includes('@'));

    try {
      await login(identifier, password);
      // Check for redirect path after successful login
      const redirectPath = localStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        localStorage.removeItem('redirectAfterLogin');
        navigate(redirectPath);
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(t("loginFailed"));
    }
  };

  const handleResetPassword = async () => {
    setResetMessage("");
    setResetError("");
    if (!identifier || !identifier.includes('@')) {
      setDialogEmail(identifier || "");
      setShowResetDialog(true);
      return;
    }
    try {
      setResetLoading(true);
      const redirectTo = `${window.location.origin}/login`;
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(identifier, { redirectTo });
      if (resetErr) throw resetErr;
      setResetMessage(t("resetLinkSent"));
    } catch (e) {
      setResetError(t("resetLinkFailed"));
    } finally {
      setResetLoading(false);
    }
  };

  const handleDialogReset = async () => {
    setDialogError("");
    setDialogMessage("");
    if (!dialogEmail || !dialogEmail.includes('@')) {
      setDialogError(t("invalidEmail"));
      return;
    }
    try {
      setDialogLoading(true);
      const redirectTo = `${window.location.origin}/login`;
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(dialogEmail, { redirectTo });
      if (resetErr) throw resetErr;
      setDialogMessage(t("resetLinkSent"));
    } catch (e) {
      setDialogError(t("resetLinkFailed"));
    } finally {
      setDialogLoading(false);
    }
  };

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto py-8 border border-border/40 bg-[rgba(217,217,217,0.01)] backdrop-blur-[20px] rounded-[24px] shadow-[inset_0px_10px_20px_rgba(115,71,146,0.25),_inset_0px_-5px_15px_rgba(0,0,0,0.4)] relative">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate("/")} 
          className={`absolute top-4 ${isRtl ? 'right-4' : 'left-4'} rounded-full text-white hover:bg-white/10`}
        >
          <ArrowLeft className={isRtl ? "rotate-180" : ""} />
        </Button>
        <CardHeader className="space-y-3">
          <div className="w-full flex justify-center mb-1">
            <img src={theme === 'dark' ? '/assets/logo.png' : '/assets/logolight.png'} alt="Art Space" className="h-16" />
          </div>
          <CardTitle className={`text-2xl font-display text-center ${isRtl ? 'rtl' : ''}`}>{t("loginTitle")}</CardTitle>
          <CardDescription className={`text-center text-indigo-200/90 font-medium text-base ${isRtl ? 'rtl' : ''}`}>
            {t("loginDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                id="identifier"
                placeholder={t("identifierPlaceholder")}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                id="password"
                type="password"
                placeholder={t("passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="text-sm flex items-center gap-2">
                <span className="text-muted-foreground">{t("forgotPassword")}</span>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={resetLoading}
                  className="text-primary hover:underline dark:text-white disabled:opacity-50"
                >
                  {resetLoading ? t("sending") : t("sendResetLink")}
                </button>
              </div>
              {resetMessage && (
                <div className="text-xs text-emerald-500">{resetMessage}</div>
              )}
              {resetError && (
                <div className="text-xs text-destructive">{resetError}</div>
              )}
            </div>

            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? t("loggingIn") : t("loginButton")}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">{t("noAccountQuestion")}</span>
            <Link to="/register" className="text-primary hover:underline">
              {t("registerNow")}
            </Link>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-0">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{t("or")}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="w-full transition-all hover:bg-red-600/10 flex items-center justify-center"
              onClick={() => signInWithProvider('google')}
            >
              <svg viewBox="0 0 48 48" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
              </svg>
            </Button>
            <Button
              variant="outline"
              className="w-full transition-all hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center"
              onClick={() => signInWithProvider('twitter')}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
              </svg>
            </Button>
          </div>
        </CardFooter>
      </Card>
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="rounded-[24px] border border-border/40 bg-[rgba(217,217,217,0.06)] backdrop-blur-[20px] shadow-[inset_0px_10px_20px_rgba(115,71,146,0.25),_inset_0px_-5px_15px_rgba(0,0,0,0.4)]">
          <DialogHeader>
            <DialogTitle>{t("dialogTitleReset")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("dialogInstructionReset")}</p>
            <Input
              type="email"
              placeholder={t("emailPlaceholder")}
              value={dialogEmail}
              onChange={(e) => setDialogEmail(e.target.value)}
            />
            {dialogError && <div className="text-xs text-destructive">{dialogError}</div>}
            {dialogMessage && <div className="text-xs text-emerald-500">{dialogMessage}</div>}
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowResetDialog(false)}>{t("cancel")}</Button>
              <Button onClick={handleDialogReset} disabled={dialogLoading}>
                {dialogLoading ? t("sending") : t("sendLink")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


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
      <div className="w-full max-w-2xl mx-auto mb-4 flex">
        <Button variant="ghost" onClick={() => navigate("/")} className="gap-2 text-white">
          <span className={isRtl ? "rotate-0" : "rotate-180"}>➜</span> {t("back")}
        </Button>
      </div>
      <Card className="w-full max-w-2xl mx-auto py-8 border border-border/40 bg-[rgba(217,217,217,0.01)] backdrop-blur-[20px] rounded-[24px] shadow-[inset_0px_10px_20px_rgba(115,71,146,0.25),_inset_0px_-5px_15px_rgba(0,0,0,0.4)]">
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
              <Label htmlFor="identifier">{t("identifierLabel")}</Label>
              <Input
                id="identifier"
                placeholder={t("identifierPlaceholder")}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("passwordLabel")}</Label>
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

          <div className="grid grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="w-full transition-all hover:bg-blue-600/10"
              onClick={() => signInWithProvider('facebook')}
            >
              {t("facebook")}
            </Button>
            <Button
              variant="outline"
              className="w-full transition-all hover:bg-red-600/10"
              onClick={() => signInWithProvider('google')}
            >
              {t("google")}
            </Button>
            <Button
              variant="outline"
              className="w-full transition-all hover:bg-indigo-600/10"
              onClick={() => signInWithProvider('adobe')}
            >
              {t("adobe")}
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

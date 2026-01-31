import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/use-translation";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export function RegisterForm() {
  const { register, loading, signInWithProvider } = useAuth();
  const navigate = useNavigate();
  const { t, isRtl } = useTranslation();
  const { theme } = useTheme();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !displayName.trim() || !username.trim() || !password.trim() || !confirmPassword.trim()) {
      setError(t("errorFillAllFields"));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t("invalidEmail"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("passwordsNotMatch"));
      return;
    }

    if (password.length < 6) {
      setError(t("passwordTooShort"));
      return;
    }

    try {
      await register(email, password, displayName);
      // Move to profile completion step
      setStep(2);
    } catch (err) {
      setError(t("registerFailed"));
      console.error("Registration error:", err);
    }
  };

  const handleCompleteProfile = async () => {
    try {
      setSaving(true);
      setError("");

      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) {
        setError(t("mustLoginToCompleteProfile"));
        return;
      }

      let avatarUrl: string | undefined = undefined;
      let headerUrl: string | undefined = undefined;

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = `${userId}/avatars/avatar.${ext}`;
        const { error: upErr } = await supabase.storage.from('media').upload(path, avatarFile, { upsert: true });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('media').getPublicUrl(path);
        avatarUrl = pub.publicUrl;
      }

      if (bannerFile) {
        const ext = bannerFile.name.split('.').pop();
        const path = `${userId}/banners/header.${ext}`;
        const { error: upErr2 } = await supabase.storage.from('media').upload(path, bannerFile, { upsert: true });
        if (upErr2) throw upErr2;
        const { data: pub2 } = supabase.storage.from('media').getPublicUrl(path);
        headerUrl = pub2.publicUrl;
      }

      const updates: any = {
        username: username,
        display_name: displayName,
        bio: bio,
      };
      if (avatarUrl) updates.avatar_url = avatarUrl;
      if (headerUrl) updates.header_image = headerUrl;

      const { error: updErr } = await supabase.from('profiles').update(updates).eq('id', userId);
      if (updErr) throw updErr;

      navigate("/");
    } catch (err) {
      console.error('Complete profile error:', err);
      setError("تعذر حفظ الملف الشخصي، حاول لاحقًا");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto border border-border/40 bg-[rgba(217,217,217,0.01)] backdrop-blur-[20px] rounded-[24px] shadow-[inset_0px_10px_20px_rgba(115,71,146,0.25),_inset_0px_-5px_15px_rgba(0,0,0,0.4)] relative">
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
            <img src={theme === 'dark' ? '/assets/logo.png' : '/assets/logolight.png'} alt="Art Space" className="h-10" />
          </div>
          {step === 1 ? (
            <>
              <CardTitle className={`text-2xl font-display text-center ${isRtl ? 'rtl' : ''}`}>{t("registerTitle")}</CardTitle>
              <CardDescription className={`text-center text-indigo-200/90 font-medium text-base ${isRtl ? 'rtl' : ''}`}>
                {t("registerDesc")}
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className={`text-2xl font-display text-center ${isRtl ? 'rtl' : ''}`}>{t("completeProfileTitle")}</CardTitle>
              <CardDescription className={`text-center text-indigo-200/90 font-medium text-base ${isRtl ? 'rtl' : ''}`}>
                {t("completeProfileDesc")}
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Input
                    id="displayName"
                    placeholder={t("namePlaceholder")}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    id="username"
                    placeholder={t("usernamePlaceholder")}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Input
                  id="email"
                  type="email"
                  placeholder={t("registerEmailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Input
                    id="password"
                    type="password"
                    placeholder={t("registerPasswordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder={t("confirmPasswordPlaceholder")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive">{error}</div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("creatingAccount") : t("next")}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="hidden">{t("coverImage")}</Label>
                  <div className="rounded-[16px] border border-border/40 bg-[rgba(217,217,217,0.06)] backdrop-blur-[12px] p-3">
                    <input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files?.[0] || null)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="hidden">{t("avatarImage")}</Label>
                  <div className="rounded-full border border-border/40 bg-[rgba(217,217,217,0.06)] backdrop-blur-[12px] p-3 w-full">
                    <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio" className="hidden">{t("aboutYou")}</Label>
                <Textarea id="bio" placeholder={t("aboutPlaceholder")} value={bio} onChange={(e) => setBio(e.target.value)} />
              </div>
              {error && (
                <div className="text-sm text-destructive">{error}</div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="w-1/3">{t("back")}</Button>
                <Button onClick={handleCompleteProfile} disabled={saving} className="w-2/3">
                  {saving ? t("creating") : t("createYourAccount")}
                </Button>
              </div>
            </div>
          )}

          <div className={`text-center text-sm ${isRtl ? 'rtl' : ''}`}>
            <span className="text-muted-foreground">{t("haveAccountQuestion")}</span>
            <Link to="/login" className="text-primary hover:underline">
              {t("loginNow")}
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

          <div className={`text-center text-xs text-muted-foreground ${isRtl ? 'rtl' : ''}`}>
            {t("agreeNote")}
          </div>
        </CardFooter>
      </Card>
    </>
  );
}

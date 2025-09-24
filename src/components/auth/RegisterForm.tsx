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

export function RegisterForm() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const { isRtl } = useTranslation();
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
      setError("يرجى ملء جميع الحقول");
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("البريد الإلكتروني غير صالح");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("كلمة المرور وتأكيد كلمة المرور غير متطابقين");
      return;
    }
    
    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    
    try {
      await register(email, password, displayName);
      // Move to profile completion step
      setStep(2);
    } catch (err) {
      setError("فشل إنشاء الحساب، يرجى المحاولة مرة أخرى");
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
        setError("يجب تسجيل الدخول لإكمال الملف الشخصي");
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
    <Card className="w-full max-w-2xl mx-auto border border-border/40 bg-[rgba(217,217,217,0.01)] backdrop-blur-[20px] rounded-[24px] shadow-[inset_0px_10px_20px_rgba(115,71,146,0.25),_inset_0px_-5px_15px_rgba(0,0,0,0.4)]">
      <CardHeader className="space-y-3">
        <div className="w-full flex justify-center mb-1">
          <img src={theme === 'dark' ? '/assets/logo.png' : '/assets/logolight.png'} alt="Art Space" className="h-10" />
        </div>
        {step === 1 ? (
          <>
            <CardTitle className={`text-2xl font-display text-center ${isRtl ? 'rtl' : ''}`}>إنشاء حساب جديد</CardTitle>
            <CardDescription className={`text-center ${isRtl ? 'rtl' : ''}`}>
              أنشئ حسابك للانضمام لمجتمع آرت سبيس
            </CardDescription>
          </>
        ) : (
          <>
            <CardTitle className={`text-2xl font-display text-center ${isRtl ? 'rtl' : ''}`}>لنُكمل ملفك الشخصي</CardTitle>
            <CardDescription className={`text-center ${isRtl ? 'rtl' : ''}`}>
              أضف صورة الغلاف والصورة الشخصية ونبذة قصيرة
            </CardDescription>
          </>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 1 ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">الاسم</Label>
                <Input
                  id="displayName"
                  placeholder="اسمك الكامل"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input
                  id="username"
                  placeholder="اسم_المستخدم"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="أدخل بريدك الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="كلمة المرور، 6 أحرف على الأقل"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="أعد كتابة كلمة المرور"
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
              {loading ? "جاري إنشاء الحساب..." : "التالي"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>صورة الغلاف</Label>
                <div className="rounded-[16px] border border-border/40 bg-[rgba(217,217,217,0.06)] backdrop-blur-[12px] p-3">
                  <input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files?.[0] || null)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>الصورة الشخصية</Label>
                <div className="rounded-full border border-border/40 bg-[rgba(217,217,217,0.06)] backdrop-blur-[12px] p-3 w-full">
                  <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">نبذة عنك</Label>
              <Textarea id="bio" placeholder="اكتب نبذة قصيرة..." value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>
            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="w-1/3">رجوع</Button>
              <Button onClick={handleCompleteProfile} disabled={saving} className="w-2/3">
                {saving ? "جاري الحفظ..." : "إنشاء حسابك"}
              </Button>
            </div>
          </div>
        )}

        <div className={`text-center text-sm ${isRtl ? 'rtl' : ''}`}>
          <span className="text-muted-foreground">لديك حساب بالفعل؟ </span>
          <Link to="/login" className="text-primary hover:underline">
            سجل دخول
          </Link>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 pt-0">
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">أو</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" disabled className="w-full">
            فيسبوك
          </Button>
          <Button variant="outline" disabled className="w-full">
            جوجل
          </Button>
        </div>
        
        <div className={`text-center text-xs text-muted-foreground ${isRtl ? 'rtl' : ''}`}>
          بالتسجيل، أنت توافق على شروط الاستخدام وسياسة الخصوصية الخاصة بنا.
        </div>
      </CardFooter>
    </Card>
  );
}

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function RegisterForm() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const { isRtl } = useTranslation();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email.trim() || !displayName.trim() || !password.trim() || !confirmPassword.trim()) {
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
      navigate("/");
    } catch (err) {
      setError("فشل إنشاء الحساب، يرجى المحاولة مرة أخرى");
      console.error("Registration error:", err);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-md border-border/40 bg-card/30">
      <CardHeader className="space-y-1">
        <CardTitle className={`text-2xl font-display text-center ${isRtl ? 'rtl' : ''}`}>إنشاء حساب جديد</CardTitle>
        <CardDescription className={`text-center ${isRtl ? 'rtl' : ''}`}>
          أنشئ حسابك للانضمام لمجتمع آرت سبيس
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
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
          
          <div className="space-y-2">
            <Label htmlFor="displayName">الاسم الظاهر</Label>
            <Input
              id="displayName"
              placeholder="الاسم الذي سيظهر للآخرين"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
          
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
          
          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}
          
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
          </Button>
        </form>
        
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

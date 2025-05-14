
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isEmail, setIsEmail] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!identifier.trim() || !password.trim()) {
      setError("يرجى ملء جميع الحقول");
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
      setError("فشل تسجيل الدخول، يرجى التحقق من اسم المستخدم وكلمة المرور");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-md border-border/40 bg-card/30">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-display text-center">تسجيل الدخول</CardTitle>
        <CardDescription className="text-center">
          أدخل بيانات حسابك للوصول لمنصة آرت سبيس
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">البريد الإلكتروني أو اسم المستخدم</Label>
            <Input
              id="identifier"
              placeholder="أدخل البريد الإلكتروني أو اسم المستخدم"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password">كلمة المرور</Label>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                نسيت كلمة المرور؟
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="أدخل كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </Button>
        </form>
        
        <div className="text-center text-sm">
          <span className="text-muted-foreground">ليس لديك حساب؟ </span>
          <Link to="/register" className="text-primary hover:underline">
            سجل الآن
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
      </CardFooter>
    </Card>
  );
}

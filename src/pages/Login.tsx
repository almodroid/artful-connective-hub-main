import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, loading, navigate]);

  return (
    <Layout hideFooter fullBleed hideSidebars forceDarkMode={true} hideHeader={true} hideBottomBar={true}>
      <div className="min-h-screen w-full bg-[url('/assets/bg.png')] bg-cover bg-center flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-md px-0 md:px-0">
          <LoginForm />
        </div>
      </div>
    </Layout>
  );
};

export default Login;

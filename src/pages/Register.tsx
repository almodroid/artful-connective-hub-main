import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { useAuth } from "@/contexts/AuthContext";

const Register = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, loading, navigate]);

  return (
    <Layout hideFooter fullBleed>
      <div className="min-h-screen w-full bg-[url('/assets/bg.png')] bg-cover bg-center flex items-center justify-center px-0 py-8">
        <div className="w-full max-w-md px-0 md:px-0">
          <RegisterForm />
        </div>
      </div>
    </Layout>
  );
};

export default Register;

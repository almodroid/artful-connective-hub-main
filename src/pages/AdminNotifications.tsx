
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { NotificationsManagement } from "@/components/admin/NotificationsManagement";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/use-translation";

const AdminNotifications = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { isRtl } = useTranslation();
  
  useEffect(() => {
    if (!isAuthenticated || (user && !user.isAdmin)) {
      navigate("/");
    }
  }, [isAuthenticated, user, navigate]);
  
  if (!isAuthenticated || (user && !user.isAdmin)) {
    return null;
  }
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-muted/10" dir={isRtl ? "rtl" : "ltr"}>
      <AdminSidebar />
      
      <main className={`flex-1 ${isRtl ? 'md:mr-64' : 'md:ml-64'} py-6 px-4 md:px-8 overflow-auto`}>
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold">إدارة الإشعارات</h1>
          <p className="text-muted-foreground">إرسال وإدارة الإشعارات للمستخدمين</p>
        </div>
        
        <NotificationsManagement />
      </main>
    </div>
  );
};

export default AdminNotifications;

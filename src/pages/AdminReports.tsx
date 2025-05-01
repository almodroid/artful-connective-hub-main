import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ReportsManagement } from "@/components/admin/ReportsManagement";
import { ReelReportsManagement } from "@/components/admin/ReelReportsManagement";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/use-translation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminReports = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { isRtl } = useTranslation();
  const [activeTab, setActiveTab] = useState<"general" | "reels">("general");
  
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
          <h1 className="text-2xl font-display font-bold">{isRtl ? "إدارة البلاغات" : "Reports Management"}</h1>
          <p className="text-muted-foreground">
            {isRtl 
              ? "مراجعة وإدارة بلاغات المستخدمين عن المحتوى المخالف" 
              : "Review and manage user reports about inappropriate content"
            }
          </p>
        </div>
        
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as "general" | "reels")}
          className="w-full"
        >
          <TabsList className="mb-6">
            <TabsTrigger value="general">
              {isRtl ? "البلاغات العامة" : "General Reports"}
            </TabsTrigger>
            <TabsTrigger value="reels">
              {isRtl ? "بلاغات الريلز" : "Reel Reports"}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <ReportsManagement />
          </TabsContent>
          
          <TabsContent value="reels">
            <ReelReportsManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminReports;


import { 
  AlertTriangle, 
  BarChart, 
  MessageSquare,
  TrendingUp, 
  User, 
  Users 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { fetchSystemStats } from "@/services/admin.service";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: number;
  isLoading?: boolean;
}

function StatCard({ title, value, description, icon, trend, isLoading = false }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-24 mb-1" />
            {description && <Skeleton className="h-4 w-32" />}
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            {trend !== undefined && (
              <div className={`flex items-center text-xs mt-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {trend >= 0 ? (
                  <TrendingUp className="h-3 w-3 me-1" />
                ) : (
                  <div className="transform rotate-180">
                    <TrendingUp className="h-3 w-3 me-1" />
                  </div>
                )}
                <span>{Math.abs(trend)}% من الأسبوع الماضي</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchSystemStats
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard
        title="إجمالي المستخدمين"
        value={stats?.totalUsers || 0}
        description={`${stats?.newUsersToday || 0} مستخدم جديد اليوم`}
        icon={<Users className="h-4 w-4 text-primary" />}
        trend={4.3}
        isLoading={isLoading}
      />
      
      <StatCard
        title="المستخدمين النشطين"
        value={stats?.activeUsers || 0}
        description="في الـ 24 ساعة الماضية"
        icon={<User className="h-4 w-4 text-primary" />}
        trend={2.1}
        isLoading={isLoading}
      />
      
      <StatCard
        title="المنشورات"
        value={stats?.totalPosts || 0}
        description={`${stats?.postsToday || 0} منشور جديد اليوم`}
        icon={<MessageSquare className="h-4 w-4 text-primary" />}
        trend={12.6}
        isLoading={isLoading}
      />
      
      <StatCard
        title="المحتوى المبلغ عنه"
        value={stats?.reportedContent || 0}
        description="بلاغات تحتاج للمراجعة"
        icon={<AlertTriangle className="h-4 w-4 text-primary" />}
        isLoading={isLoading}
      />
      
      <StatCard
        title="معدل المشاركة"
        value={`${stats?.engagement || 0}%`}
        description="نسبة التفاعل مع المنشورات"
        icon={<BarChart className="h-4 w-4 text-primary" />}
        trend={-1.8}
        isLoading={isLoading}
      />
      
      <StatCard
        title="معدل النمو"
        value="18.2%"
        description="مقارنة بالشهر الماضي"
        icon={<TrendingUp className="h-4 w-4 text-primary" />}
        trend={3.4}
        isLoading={isLoading}
      />
    </div>
  );
}

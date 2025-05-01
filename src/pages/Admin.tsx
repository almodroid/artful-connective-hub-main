
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Line, Bar } from "recharts";
import { Chart } from "@/components/ui/chart";
import { useQuery } from "@tanstack/react-query";
import { fetchActivityData, fetchContentDistribution, fetchReports } from "@/services/admin.service";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/use-translation";

const Admin = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { isRtl } = useTranslation();
  
  // Fetch activity data for charts
  const { data: activityData, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['admin-activity'],
    queryFn: fetchActivityData
  });
  
  // Fetch content distribution data
  const { data: distributionData, isLoading: isLoadingDistribution } = useQuery({
    queryKey: ['content-distribution'],
    queryFn: fetchContentDistribution
  });
  
  // Fetch reports
  const { data: reports, isLoading: isLoadingReports } = useQuery({
    queryKey: ['reports'],
    queryFn: fetchReports
  });
  
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
          <h1 className="text-2xl font-display font-bold">لوحة المعلومات</h1>
          <p className="text-muted-foreground">مرحباً بك في لوحة تحكم آرت سبيس</p>
        </div>
        
        <div className="space-y-6">
          <DashboardStats />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>نشاط المستخدمين</CardTitle>
                <CardDescription>
                  عدد المستخدمين والمنشورات خلال الأشهر الماضية
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {isLoadingActivity ? (
                    <div className="flex items-center justify-center h-full">
                      <Skeleton className="h-64 w-full" />
                    </div>
                  ) : (
                    <Chart config={{ users: { label: "المستخدمين" }, posts: { label: "المنشورات" } }}>
                      <Line
                        data={activityData}
                        dataKey="users"
                        name="المستخدمين"
                        stroke="hsl(221.2 83.2% 53.3%)"
                        strokeWidth={2}
                        activeDot={{ r: 6 }}
                        dot={false}
                      />
                      <Line
                        data={activityData}
                        dataKey="posts"
                        name="المنشورات"
                        stroke="hsl(217.2 91.2% 59.8%)"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        dot={false}
                      />
                    </Chart>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>توزيع المحتوى</CardTitle>
                <CardDescription>
                  أنواع المحتوى المنشور على المنصة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {isLoadingDistribution ? (
                    <div className="flex items-center justify-center h-full">
                      <Skeleton className="h-64 w-full" />
                    </div>
                  ) : (
                    <Chart config={{ value: { label: "المحتوى" } }}>
                      <Bar
                        data={distributionData}
                        dataKey="value"
                        name="المحتوى"
                        fill="hsl(217.2 91.2% 59.8%)"
                      />
                    </Chart>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>أحدث البلاغات</CardTitle>
              <CardDescription>
                قائمة بأحدث البلاغات التي تحتاج للمراجعة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pending">
                <TabsList className="mb-4">
                  <TabsTrigger value="pending">قيد الانتظار</TabsTrigger>
                  <TabsTrigger value="all">جميع البلاغات</TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-0">
                  {isLoadingReports ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : reports && reports.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>المستخدم</TableHead>
                            <TableHead>نوع البلاغ</TableHead>
                            <TableHead>المحتوى</TableHead>
                            <TableHead>التاريخ</TableHead>
                            <TableHead className="text-left">الإجراء</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reports
                            .filter(report => report.status === "pending")
                            .map((report) => (
                              <TableRow key={report.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={`https://i.pravatar.cc/150?u=${report.userId}`} />
                                      <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                    <span>{report.userId}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium text-destructive">{report.reason}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-64 truncate">{report.content}</TableCell>
                                <TableCell>{report.createdAt.toLocaleDateString()}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm">
                                      تجاهل
                                    </Button>
                                    <Button size="sm" variant="destructive">
                                      حذف المحتوى
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      لا توجد بلاغات قيد الانتظار
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="all" className="mt-0">
                  {isLoadingReports ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : reports && reports.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>المستخدم</TableHead>
                            <TableHead>نوع البلاغ</TableHead>
                            <TableHead>المحتوى</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead>التاريخ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reports.map((report) => (
                            <TableRow key={report.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={`https://i.pravatar.cc/150?u=${report.userId}`} />
                                    <AvatarFallback>U</AvatarFallback>
                                  </Avatar>
                                  <span>{report.userId}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <span className="font-medium text-destructive">{report.reason}</span>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-64 truncate">{report.content}</TableCell>
                              <TableCell>
                                <div className={`px-2 py-1 rounded-full text-xs inline-block ${
                                  report.status === "pending" 
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400" 
                                    : report.status === "reviewed" 
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400" 
                                      : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                }`}>
                                  {report.status === "pending" 
                                    ? "قيد الانتظار" 
                                    : report.status === "reviewed" 
                                      ? "تمت المراجعة" 
                                      : "تم الحل"}
                                </div>
                              </TableCell>
                              <TableCell>{report.createdAt.toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      لا توجد بلاغات
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Admin;

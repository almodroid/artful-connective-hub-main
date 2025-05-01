import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle, XCircle, AlertTriangle, Trash } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

// Define the Report interface
interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  content_type: 'post' | 'comment' | 'user';
  content_id: string;
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at: string;
  reporter: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  reported: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export function ReportsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const { isRtl } = useTranslation();
  
  // Fetch all reports
  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      try {
        // First, check if the reports table exists, if not create it
        const { error: tableCheckError } = await supabase
          .from('reports' as any)
          .select('id')
          .limit(1);
        
        if (tableCheckError && tableCheckError.code === '42P01') {
          // Table doesn't exist, create it
          const { error: createTableError } = await supabase.rpc('create_reports_table' as any);
          
          if (createTableError) {
            console.error("Error creating reports table:", createTableError);
            throw createTableError;
          }
          
          // Return empty array since the table was just created
          return [];
        }
        
        // Get all reports with reporter and reported user data
        const { data: reportsData, error: reportsError } = await supabase
          .from('reports' as any)
          .select(`
            id, 
            reporter_id, 
            reported_id, 
            content_type, 
            content_id, 
            reason, 
            description, 
            status, 
            created_at, 
            updated_at,
            reporter:profiles!reports_reporter_id_fkey(id, username, display_name, avatar_url),
            reported:profiles!reports_reported_id_fkey(id, username, display_name, avatar_url)
          `)
          .order('created_at', { ascending: false });
        
        if (reportsError) {
          console.error("Error fetching reports:", reportsError);
          toast.error(isRtl ? "حدث خطأ أثناء جلب البلاغات" : "Error fetching reports");
          throw reportsError;
        }
        
        return reportsData as unknown as Report[];
      } catch (error) {
        console.error("Error in reports query:", error);
        toast.error(isRtl ? "حدث خطأ أثناء جلب البلاغات" : "Error fetching reports");
        throw error;
      }
    }
  });
  
  // Resolve report mutation
  const resolveReportMutation = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string, status: 'resolved' | 'dismissed' }) => {
      const { error } = await supabase
        .from('reports' as any)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', reportId);
      
      if (error) {
        console.error(`Error ${status === 'resolved' ? 'resolving' : 'dismissing'} report:`, error);
        throw error;
      }
      
      return { success: true };
    },
    onSuccess: (_, variables) => {
      const { status } = variables;
      toast.success(
        isRtl 
          ? `تم ${status === 'resolved' ? 'حل' : 'رفض'} البلاغ بنجاح` 
          : `Report ${status === 'resolved' ? 'resolved' : 'dismissed'} successfully`
      );
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
    onError: (error) => {
      console.error("Error updating report:", error);
      toast.error(
        isRtl 
          ? "حدث خطأ أثناء تحديث البلاغ" 
          : "Error updating report"
      );
    }
  });
  
  // Delete report mutation
  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from('reports' as any)
        .delete()
        .eq('id', reportId);
      
      if (error) {
        console.error("Error deleting report:", error);
        throw error;
      }
      
      return { success: true };
    },
    onSuccess: () => {
      toast.success(
        isRtl 
          ? "تم حذف البلاغ بنجاح" 
          : "Report deleted successfully"
      );
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
    onError: (error) => {
      console.error("Error deleting report:", error);
      toast.error(
        isRtl 
          ? "حدث خطأ أثناء حذف البلاغ" 
          : "Error deleting report"
      );
    }
  });
  
  // Filter reports based on search term
  const filteredReports = searchTerm && reports 
    ? reports.filter(report => 
        report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reporter.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reported.display_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : reports;
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {isRtl ? "قيد الانتظار" : "Pending"}
          </Badge>
        );
      case 'resolved':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            {isRtl ? "تم الحل" : "Resolved"}
          </Badge>
        );
      case 'dismissed':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            {isRtl ? "مرفوض" : "Dismissed"}
          </Badge>
        );
      default:
        return null;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>إدارة البلاغات</CardTitle>
        <CardDescription>
          عرض وإدارة البلاغات المقدمة من المستخدمين
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="البحث عن بلاغ..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>جاري تحميل البيانات...</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>تم الإبلاغ عن</TableHead>
                  <TableHead>نوع المحتوى</TableHead>
                  <TableHead>السبب</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports?.map(report => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={report.reporter.avatar_url} alt={report.reporter.display_name} />
                          <AvatarFallback>{report.reporter.display_name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{report.reporter.display_name}</p>
                          <p className="text-sm text-muted-foreground">@{report.reporter.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={report.reported.avatar_url} alt={report.reported.display_name} />
                          <AvatarFallback>{report.reported.display_name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{report.reported.display_name}</p>
                          <p className="text-sm text-muted-foreground">@{report.reported.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {report.content_type === 'post' && (isRtl ? "منشور" : "Post")}
                      {report.content_type === 'comment' && (isRtl ? "تعليق" : "Comment")}
                      {report.content_type === 'user' && (isRtl ? "مستخدم" : "User")}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={report.description}>
                        {report.reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(report.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(report.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {report.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => resolveReportMutation.mutate({ 
                                reportId: report.id, 
                                status: 'resolved' 
                              })}
                            >
                              {isRtl ? "حل" : "Resolve"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => resolveReportMutation.mutate({ 
                                reportId: report.id, 
                                status: 'dismissed' 
                              })}
                            >
                              {isRtl ? "رفض" : "Dismiss"}
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(isRtl ? "هل أنت متأكد من حذف هذا البلاغ؟" : "Are you sure you want to delete this report?")) {
                              deleteReportMutation.mutate(report.id);
                            }
                          }}
                          title={isRtl ? "حذف" : "Delete"}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

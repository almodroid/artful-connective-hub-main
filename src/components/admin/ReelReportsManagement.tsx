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
import { Search, CheckCircle, XCircle, AlertTriangle, Trash, Eye, Film } from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter, DialogClose 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/use-translation";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

// Define the ReelReport interface
interface ReelReport {
  id: string;
  reel_id: string;
  reporter_id: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'rejected';
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  reporter: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  reel: {
    id: string;
    caption: string;
    video_url: string;
    thumbnail_url?: string;
    user_id: string;
    created_at: string;
    user?: {
      username: string;
      display_name: string;
      avatar_url?: string;
    };
  };
}

export function ReelReportsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReport, setSelectedReport] = useState<ReelReport | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [activeTab, setActiveTab] = useState<'pending' | 'reviewed' | 'all'>('pending');
  const queryClient = useQueryClient();
  const { isRtl } = useTranslation();
  
  // Fetch all reel reports
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["admin-reel-reports"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('reel_reports')
          .select(`
            id, 
            reel_id, 
            reporter_id, 
            reason,
            status,
            admin_notes,
            created_at, 
            reviewed_at,
            reviewed_by,
            reporter:profiles!reel_reports_reporter_id_fkey(
              id, username, display_name, avatar_url
            ),
            reel:reels!reel_reports_reel_id_fkey(
              id, caption, video_url, thumbnail_url, user_id, created_at,
              user:profiles!reels_user_id_fkey(
                username, display_name, avatar_url
              )
            )
          `)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Error fetching reel reports:", error);
          toast.error(isRtl ? "حدث خطأ أثناء جلب بلاغات الريلز" : "Error fetching reel reports");
          throw error;
        }
        
        return data as unknown as ReelReport[];
      } catch (error) {
        console.error("Error in reel reports query:", error);
        toast.error(isRtl ? "حدث خطأ أثناء جلب بلاغات الريلز" : "Error fetching reel reports");
        throw error;
      }
    }
  });
  
  // Update report status mutation
  const updateReportStatusMutation = useMutation({
    mutationFn: async ({ 
      reportId, 
      status, 
      notes 
    }: { 
      reportId: string, 
      status: 'reviewed' | 'rejected',
      notes: string
    }) => {
      const { error } = await supabase
        .from('reel_reports')
        .update({ 
          status, 
          admin_notes: notes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', reportId);
      
      if (error) {
        console.error(`Error updating reel report:`, error);
        throw error;
      }
      
      return { success: true };
    },
    onSuccess: (_, variables) => {
      const { status } = variables;
      toast.success(
        isRtl 
          ? `تم ${status === 'reviewed' ? 'مراجعة' : 'رفض'} البلاغ بنجاح` 
          : `Report ${status === 'reviewed' ? 'reviewed' : 'rejected'} successfully`
      );
      queryClient.invalidateQueries({ queryKey: ["admin-reel-reports"] });
      setIsDetailsOpen(false);
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
  
  // Delete reel mutation
  const deleteReelMutation = useMutation({
    mutationFn: async (reelId: string) => {
      // First get the reel to have video URL for cleanup
      const { data: reelData, error: reelError } = await supabase
        .from("reels")
        .select("video_url, user_id")
        .eq("id", reelId)
        .single();
      
      if (reelError) {
        console.error("Error fetching reel:", reelError);
        throw reelError;
      }

      // Delete the reel from the database
      const { error: deleteError } = await supabase
        .from("reels")
        .delete()
        .eq("id", reelId);

      if (deleteError) {
        console.error("Error deleting reel:", deleteError);
        throw deleteError;
      }

      // Try to delete the video file from storage
      if (reelData?.video_url) {
        // Extract the path from the URL
        const videoPath = reelData.video_url.split('/').slice(-2).join('/');
        if (videoPath) {
          await supabase.storage
            .from("reels")
            .remove([videoPath]);
        }
      }
      
      return { success: true };
    },
    onSuccess: () => {
      toast.success(
        isRtl 
          ? "تم حذف الريل بنجاح" 
          : "Reel deleted successfully"
      );
      queryClient.invalidateQueries({ queryKey: ["admin-reel-reports"] });
      setIsDeleteDialogOpen(false);
      // Also update the reel reports that reference this reel
      if (selectedReport) {
        // Update the report status
        updateReportStatusMutation.mutate({ 
          reportId: selectedReport.id, 
          status: 'reviewed', 
          notes: adminNotes || (isRtl ? "تم حذف الريل" : "Reel was deleted")
        });
      }
    },
    onError: (error) => {
      console.error("Error deleting reel:", error);
      toast.error(
        isRtl 
          ? "حدث خطأ أثناء حذف الريل" 
          : "Error deleting reel"
      );
    }
  });
  
  // Filter reports based on search term and active tab
  const filteredReports = reports
    .filter(report => {
      if (activeTab === 'pending') return report.status === 'pending';
      if (activeTab === 'reviewed') return report.status === 'reviewed' || report.status === 'rejected';
      return true; // 'all' tab
    })
    .filter(report => {
      if (!searchTerm) return true;
      
      const searchTermLower = searchTerm.toLowerCase();
      return (
        report.reason?.toLowerCase().includes(searchTermLower) ||
        report.reporter?.display_name.toLowerCase().includes(searchTermLower) ||
        report.reel?.user?.display_name?.toLowerCase().includes(searchTermLower) ||
        report.reel?.caption?.toLowerCase().includes(searchTermLower)
      );
    });
  
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
      case 'reviewed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            {isRtl ? "تمت المراجعة" : "Reviewed"}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            {isRtl ? "مرفوض" : "Rejected"}
          </Badge>
        );
      default:
        return null;
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: isRtl ? ar : undefined
    });
  };
  
  // Handle opening the report details
  const handleViewDetails = (report: ReelReport) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || '');
    setIsDetailsOpen(true);
  };
  
  // Handle deleting a reel
  const handleDeleteReel = () => {
    if (selectedReport) {
      deleteReelMutation.mutate(selectedReport.reel.id);
    }
  };
  
  // Handle updating report status
  const handleUpdateStatus = (status: 'reviewed' | 'rejected') => {
    if (selectedReport) {
      updateReportStatusMutation.mutate({
        reportId: selectedReport.id,
        status,
        notes: adminNotes
      });
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isRtl ? "بلاغات الريلز" : "Reel Reports"}</CardTitle>
        <CardDescription>
          {isRtl ? "عرض وإدارة بلاغات المستخدمين عن الريلز" : "View and manage reel reports from users"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className={`absolute ${isRtl ? 'right-2.5' : 'left-2.5'} top-2.5 h-4 w-4 text-muted-foreground`} />
              <Input
                type="search"
                placeholder={isRtl ? "البحث عن بلاغ..." : "Search reports..."}
                className={isRtl ? "pr-8" : "pl-8"}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Tabs 
              value={activeTab} 
              onValueChange={(value) => setActiveTab(value as 'pending' | 'reviewed' | 'all')}
              className="w-auto"
            >
              <TabsList>
                <TabsTrigger value="pending">
                  {isRtl ? "قيد الانتظار" : "Pending"}
                </TabsTrigger>
                <TabsTrigger value="reviewed">
                  {isRtl ? "تمت المراجعة" : "Reviewed"}
                </TabsTrigger>
                <TabsTrigger value="all">
                  {isRtl ? "الكل" : "All"}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p>{isRtl ? "جاري تحميل البيانات..." : "Loading data..."}</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="flex justify-center items-center h-64 text-muted-foreground">
              <p>{isRtl ? "لا توجد بلاغات" : "No reports found"}</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isRtl ? "المُبلغ" : "Reporter"}</TableHead>
                    <TableHead>{isRtl ? "ناشر الريل" : "Reel Publisher"}</TableHead>
                    <TableHead>{isRtl ? "سبب البلاغ" : "Reason"}</TableHead>
                    <TableHead>{isRtl ? "تاريخ البلاغ" : "Report Date"}</TableHead>
                    <TableHead>{isRtl ? "الحالة" : "Status"}</TableHead>
                    <TableHead className="text-center">{isRtl ? "الإجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={report.reporter.avatar_url || ''} />
                            <AvatarFallback>{report.reporter.display_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{report.reporter.display_name}</p>
                            <p className="text-xs text-muted-foreground">@{report.reporter.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={report.reel.user?.avatar_url || ''} />
                            <AvatarFallback>{report.reel.user?.display_name?.charAt(0) || '?'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{report.reel.user?.display_name || '—'}</p>
                            <p className="text-xs text-muted-foreground">@{report.reel.user?.username || '—'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate">
                          <p className="text-sm">{report.reason}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{formatDate(report.created_at)}</p>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(report.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(report)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>

      {/* Report Details Dialog */}
      {selectedReport && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{isRtl ? "تفاصيل البلاغ" : "Report Details"}</DialogTitle>
              <DialogDescription>
                {isRtl ? "مراجعة تفاصيل البلاغ واتخاذ إجراء" : "Review report details and take action"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">{isRtl ? "المُبلغ" : "Reporter"}</h3>
                  <div className="flex items-center gap-2 bg-muted p-2 rounded">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedReport.reporter.avatar_url || ''} />
                      <AvatarFallback>{selectedReport.reporter.display_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{selectedReport.reporter.display_name}</p>
                      <p className="text-xs text-muted-foreground">@{selectedReport.reporter.username}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">{isRtl ? "سبب البلاغ" : "Report Reason"}</h3>
                  <div className="bg-muted p-2 rounded text-sm">
                    {selectedReport.reason}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">{isRtl ? "تاريخ البلاغ" : "Report Date"}</h3>
                  <div className="bg-muted p-2 rounded text-sm">
                    {new Date(selectedReport.created_at).toLocaleString()}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">{isRtl ? "الحالة" : "Status"}</h3>
                  <div className="bg-muted p-2 rounded text-sm">
                    {getStatusBadge(selectedReport.status)}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">{isRtl ? "ملاحظات الإدارة" : "Admin Notes"}</h3>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder={isRtl ? "أضف ملاحظات حول هذا البلاغ..." : "Add notes about this report..."}
                    className="min-h-[100px]"
                    disabled={selectedReport.status !== 'pending'}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">{isRtl ? "ريل المبلغ عنه" : "Reported Reel"}</h3>
                  <div className="bg-muted p-2 rounded">
                    <div className="aspect-[9/16] relative">
                      {selectedReport.reel.thumbnail_url ? (
                        <img
                          src={selectedReport.reel.thumbnail_url}
                          alt="Reel thumbnail"
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-black rounded">
                          <Film className="h-10 w-10 text-white/50" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={selectedReport.reel.user?.avatar_url || ''} />
                            <AvatarFallback>{selectedReport.reel.user?.display_name?.charAt(0) || '?'}</AvatarFallback>
                          </Avatar>
                          <div className="text-white text-xs">
                            {selectedReport.reel.user?.display_name || '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm mt-2 line-clamp-2">
                      {selectedReport.reel.caption || (isRtl ? "بدون وصف" : "No caption")}
                    </p>
                    <div className="flex justify-end mt-2">
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => window.open(`/reel/${selectedReport.reel.id}`, '_blank')}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        {isRtl ? "عرض الريل" : "View Reel"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {selectedReport.status === 'pending' && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    {isRtl ? "حذف الريل" : "Delete Reel"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus('rejected')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {isRtl ? "رفض البلاغ" : "Reject Report"}
                  </Button>
                  <Button 
                    onClick={() => handleUpdateStatus('reviewed')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isRtl ? "مراجعة البلاغ" : "Review Report"}
                  </Button>
                </>
              )}
              <DialogClose asChild>
                <Button variant="ghost">
                  {isRtl ? "إغلاق" : "Close"}
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRtl ? "حذف الريل" : "Delete Reel"}</DialogTitle>
            <DialogDescription>
              {isRtl 
                ? "هل أنت متأكد من حذف هذا الريل؟ هذا الإجراء نهائي ولا يمكن التراجع عنه."
                : "Are you sure you want to delete this reel? This action cannot be undone."
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">
                {isRtl ? "إلغاء" : "Cancel"}
              </Button>
            </DialogClose>
            <Button 
              variant="destructive"
              onClick={handleDeleteReel}
              disabled={deleteReelMutation.isPending}
            >
              {deleteReelMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Trash className="h-4 w-4 mr-2" />
              )}
              {isRtl ? "تأكيد الحذف" : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 
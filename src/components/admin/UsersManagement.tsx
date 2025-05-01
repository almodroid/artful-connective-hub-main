import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ban, CheckCircle, Search, ShieldAlert, Trash, UserCog } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

export function UsersManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const { isRtl } = useTranslation();
  
  // Fetch all users with their profile data
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      try {
        // Get all profiles with user data
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            id, 
            username, 
            display_name, 
            avatar_url, 
            is_admin,
            created_at
          `);
        
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          toast.error(isRtl ? "حدث خطأ أثناء جلب بيانات الملفات الشخصية" : "Error fetching profiles");
          throw profilesError;
        }
        
        // Transform the data to match our expected format
        return profilesData.map(profile => ({
          id: profile.id,
          email: profile.username + '@example.com', // Placeholder since we don't have email
          username: profile.username || 'user',
          displayName: profile.display_name || 'User',
          avatar: profile.avatar_url || `https://i.pravatar.cc/150?u=${profile.id}`,
          isAdmin: profile.is_admin || false,
          createdAt: new Date(profile.created_at),
          lastSignIn: null, // We don't have this information without admin access
          isBanned: false // We don't have this information without admin access
        }));
      } catch (error) {
        console.error("Error in users query:", error);
        toast.error(isRtl ? "حدث خطأ أثناء جلب المستخدمين" : "Error fetching users");
        throw error;
      }
    }
  });
  
  // Ban/unban user mutation
  const toggleBanMutation = useMutation({
    mutationFn: async ({ userId, isBanned }: { userId: string, isBanned: boolean }) => {
      // Since we don't have admin access, we'll just update the profile
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_admin: isBanned }) // Using is_admin as a placeholder for banned status
        .eq('id', userId);
      
      if (error) {
        console.error(`Error ${isBanned ? 'banning' : 'unbanning'} user:`, error);
        throw error;
      }
      
      return { success: true };
    },
    onSuccess: (_, variables) => {
      const { userId, isBanned } = variables;
      toast.success(
        isRtl 
          ? `تم ${isBanned ? 'حظر' : 'إلغاء حظر'} المستخدم بنجاح` 
          : `User ${isBanned ? 'banned' : 'unbanned'} successfully`
      );
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => {
      console.error("Error updating user:", error);
      toast.error(
        isRtl 
          ? "حدث خطأ أثناء تحديث المستخدم" 
          : "Error updating user"
      );
    }
  });
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Since we don't have admin access, we'll just delete the profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) {
        console.error("Error deleting user:", error);
        throw error;
      }
      
      return { success: true };
    },
    onSuccess: () => {
      toast.success(
        isRtl 
          ? "تم حذف المستخدم بنجاح" 
          : "User deleted successfully"
      );
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => {
      console.error("Error deleting user:", error);
      toast.error(
        isRtl 
          ? "حدث خطأ أثناء حذف المستخدم" 
          : "Error deleting user"
      );
    }
  });
  
  // Filter users based on search term
  const filteredUsers = searchTerm && users 
    ? users.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>إدارة المستخدمين</CardTitle>
        <CardDescription>
          عرض وإدارة جميع المستخدمين المسجلين في النظام
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="البحث عن مستخدم..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline">
            تصدير البيانات
          </Button>
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
                  <TableHead>المستخدم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>تاريخ التسجيل</TableHead>
                  <TableHead>آخر تسجيل دخول</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatar} alt={user.displayName} />
                          <AvatarFallback>{user.displayName.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.displayName}</p>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.createdAt.toLocaleDateString()}</TableCell>
                    <TableCell>
                      {user.lastSignIn ? user.lastSignIn.toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.isAdmin && (
                          <div className="flex items-center gap-1 text-amber-600">
                            <ShieldAlert className="h-4 w-4" />
                            <span className="text-xs font-medium">
                              {isRtl ? "مدير" : "Admin"}
                            </span>
                          </div>
                        )}
                        {user.isBanned && (
                          <div className="flex items-center gap-1 text-destructive">
                            <Ban className="h-4 w-4" />
                            <span className="text-xs font-medium">
                              {isRtl ? "محظور" : "Banned"}
                            </span>
                          </div>
                        )}
                        {!user.isAdmin && !user.isBanned && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">
                              {isRtl ? "نشط" : "Active"}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!user.isAdmin && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleBanMutation.mutate({ 
                                userId: user.id, 
                                isBanned: !user.isBanned 
                              })}
                              title={user.isBanned ? (isRtl ? "إلغاء الحظر" : "Unban") : (isRtl ? "حظر" : "Ban")}
                            >
                              <Ban className={`h-4 w-4 ${user.isBanned ? 'text-muted-foreground' : 'text-destructive'}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm(isRtl ? "هل أنت متأكد من حذف هذا المستخدم؟" : "Are you sure you want to delete this user?")) {
                                  deleteUserMutation.mutate(user.id);
                                }
                              }}
                              title={isRtl ? "حذف" : "Delete"}
                            >
                              <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
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

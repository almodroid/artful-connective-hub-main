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
import { useEffect } from 'react';
const EDGE_FUNCTION_URL = 'https://zmcauzefkluwavznptlh.supabase.co/functions/v1/get-user-email';

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
            is_banned,
            created_at
          `);
        
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          toast.error(isRtl ? "حدث خطأ أثناء جلب بيانات الملفات الشخصية" : "Error fetching profiles");
          throw profilesError;
        }

        // Defensive: always return an array
        if (!profilesData || !Array.isArray(profilesData)) return [];

        // Fetch emails for each user from the edge function
        const fetchEmail = async (uid: string) => {
          try {
            // Get the current user's access token, or use the anon key if not logged in
            const { data: { session } } = await supabase.auth.getSession();
            const accessToken = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
            const res = await fetch(EDGE_FUNCTION_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ uid })
            });
            if (!res.ok) return { email: null, lastSignInAt: null };
            const data = await res.json();
            return {
              email: data.email || null,
              lastSignInAt: data.lastSignInAt || null
            };
          } catch {
            return { email: null, lastSignInAt: null };
          }
        };

        // Fetch all emails and last login in parallel
        const emailResults = await Promise.all(
          profilesData.map(profile => fetchEmail(profile.id))
        );

        // Transform the data to match our expected format
        return profilesData.map((profile, i) => ({
          id: profile.id,
          email: emailResults[i].email || '—',
          lastSignIn: emailResults[i].lastSignInAt ? new Date(emailResults[i].lastSignInAt) : null,
          username: profile.username || 'user',
          displayName: profile.display_name || 'User',
          avatar: profile.avatar_url || `https://i.pravatar.cc/150?u=${profile.id}`,
          isAdmin: profile.is_admin || false,
          createdAt: new Date(profile.created_at),
          isBanned: profile.is_banned === true
        }));
      } catch (error) {
        console.error("Error in users query:", error);
        toast.error(isRtl ? "حدث خطأ أثناء جلب المستخدمين" : "Error fetching users");
        throw error;
      }
    }
  });
  
  // Edge Function endpoint
  const ADMIN_ACTION_URL = 'https://zmcauzefkluwavznptlh.supabase.co/functions/v1/admin-user-action';

  // Ban/unban user mutation using Edge Function
  const toggleBanMutation = useMutation({
    mutationFn: async ({ userId, isBanned }: { userId: string, isBanned: boolean }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(ADMIN_ACTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ uid: userId, action: isBanned ? 'ban' : 'unban' })
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to update user');
      }
      return { success: true };
    },
    onSuccess: (_, variables) => {
      const { isBanned } = variables;
      toast.success(
        isRtl 
          ? `تم ${isBanned ? 'حظر' : 'إلغاء حظر'} المستخدم بنجاح` 
          : `User ${isBanned ? 'banned' : 'unbanned'} successfully`
      );
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      }, 100);
    },
    onError: (error: any) => {
      toast.error(
        isRtl 
          ? "حدث خطأ أثناء تحديث المستخدم" 
          : `Error updating user: ${error.message}`
      );
    }
  });

  // Delete user mutation using Edge Function
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(ADMIN_ACTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ uid: userId, action: 'delete' })
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete user');
      }
      return { success: true };
    },
    onSuccess: () => {
      toast.success(
        isRtl 
          ? "تم حذف المستخدم بنجاح" 
          : "User deleted successfully"
      );
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      }, 100);
    },
    onError: (error: any) => {
      toast.error(
        isRtl 
          ? "حدث خطأ أثناء حذف المستخدم" 
          : `Error deleting user: ${error.message}`
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
                  <TableRow key={user.id || Math.random()}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatar || ''} alt={user.displayName || 'U'} />
                          <AvatarFallback>{(user.displayName || 'U').substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.displayName || 'User'}</p>
                          <p className="text-sm text-muted-foreground">@{user.username || 'user'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email || '—'}</TableCell>
                    <TableCell>{user.createdAt ? user.createdAt.toLocaleDateString() : '—'}</TableCell>
                    <TableCell>
                      {user.lastSignIn ? user.lastSignIn.toLocaleString() : '—'}
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

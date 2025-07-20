import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Bell, Send, Trash2, Users, Globe, Plus, Search, Link } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useTranslation } from "@/hooks/use-translation";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Define the Notification interface based on the actual database schema
interface Notification {
  id: string;
  title: string;
  message: string;
  user_id?: string;
  sender_id?: string;
  is_global: boolean;
  read: boolean;
  action_type?: string;
  action_link?: string;
  created_at: string;
  image_url?: string;
  user?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  sender?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

// Define the User interface
interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

// Helper to compress image using canvas
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No canvas context');
      ctx.drawImage(img, 0, 0);
      // Only compress for jpg/webp
      const type = file.type === 'image/jpeg' || file.type === 'image/jpg' ? 'image/jpeg' : file.type === 'image/webp' ? 'image/webp' : file.type;
      const quality = (type === 'image/jpeg' || type === 'image/webp') ? 0.85 : 1.0;
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject('Compression failed');
      }, type, quality);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function NotificationsManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGlobal, setIsGlobal] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [actionType, setActionType] = useState("");
  const [actionLink, setActionLink] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const { isRtl } = useTranslation();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch all notifications
  const { data: notificationsList = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      try {
        // Get all notifications with user data
        const { data: notificationsData, error: notificationsError } = await supabase
          .from('notifications')
          .select(`
            id, 
            title, 
            message, 
            user_id, 
            sender_id,
            is_global,
            read,
            action_type,
            action_link,
            created_at,
            image_url,
            user:profiles!notifications_user_id_fkey(id, username, display_name, avatar_url),
            sender:profiles!notifications_sender_id_fkey(id, username, display_name, avatar_url)
          `)
          .order('created_at', { ascending: false });
        
        if (notificationsError) {
          console.error("Error fetching notifications:", notificationsError);
          toast.error(isRtl ? "حدث خطأ أثناء جلب الإشعارات" : "Error fetching notifications");
          throw notificationsError;
        }
        
        return (notificationsData || []) as unknown as Notification[];
      } catch (error) {
        console.error("Error in notifications query:", error);
        toast.error(isRtl ? "حدث خطأ أثناء جلب الإشعارات" : "Error fetching notifications");
        throw error;
      }
    }
  });

  // Fetch all users for personal notifications
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      try {
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, is_admin')
          .order('display_name');
        
        if (usersError) {
          console.error("Error fetching users:", usersError);
          toast.error(isRtl ? "حدث خطأ أثناء جلب المستخدمين" : "Error fetching users");
          throw usersError;
        }
        
        return usersData as User[];
      } catch (error) {
        console.error("Error in users query:", error);
        toast.error(isRtl ? "حدث خطأ أثناء جلب المستخدمين" : "Error fetching users");
        throw error;
      }
    }
  });

  // Get admin user IDs
  const adminUserIds = users.filter(u => (u as any).is_admin).map(u => u.id);

  // Only show manual notifications (not system/user-generated)
  const isManualNotification = (n: Notification) => {
    // Show if global (admin form) or sender_id is an admin
    return n.is_global || (n.sender_id && adminUserIds.includes(n.sender_id));
  };
  const manualNotifications = notificationsList.filter(isManualNotification);
  const filteredNotifications = selectedTab === "all"
    ? manualNotifications
    : selectedTab === "global"
    ? manualNotifications.filter(n => n.is_global)
    : manualNotifications.filter(n => !n.is_global && n.sender_id);
  
  // Filter notifications based on search term
  const filteredNotificationsSearch = searchTerm && filteredNotifications 
    ? filteredNotifications.filter(notification => 
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredNotifications;

  // Handle image selection
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Validate type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(isRtl ? 'يُسمح فقط بصور JPG و PNG و GIF و WEBP' : 'Only JPG, PNG, GIF, and WEBP images are allowed');
        setImageFile(null);
        setImagePreview(null);
        return;
      }
      // Validate size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(isRtl ? 'يجب أن يكون حجم الصورة أقل من 5 ميغابايت' : 'Image size must be less than 5MB');
        setImageFile(null);
        setImagePreview(null);
        return;
      }
      // Compress image if needed
      let compressedFile = file;
      if (file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/webp') {
        try {
          const blob = await compressImage(file);
          compressedFile = new File([blob], file.name, { type: blob.type });
        } catch (err) {
          toast.error(isRtl ? 'فشل ضغط الصورة' : 'Image compression failed');
        }
      }
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(compressedFile);
      setImageFile(compressedFile);
      toast.success(isRtl ? 'تم اختيار الصورة بنجاح' : 'Image selected successfully');
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  // Create notification mutation
  const createNotificationMutation = useMutation({
    mutationFn: async (data: { 
      title: string; 
      message: string; 
      is_global: boolean; 
      user_id?: string;
      action_type?: string;
      action_link?: string;
      image_file?: File | null;
    }) => {
      if (!data.title || !data.message) {
        throw new Error("Title and message are required");
      }
      let image_url = null;
      if (imageFile) {
        // Upload image to Supabase Storage (media bucket)
        const ext = imageFile.name.split('.').pop();
        const filePath = `notifications/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
        // Convert to ArrayBuffer for upload
        const arrayBuffer = await imageFile.arrayBuffer();
        const { error: uploadError } = await supabase.storage.from('media').upload(filePath, arrayBuffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: imageFile.type
        });
        if (uploadError) {
          throw uploadError;
        }
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
        image_url = urlData?.publicUrl || null;
      }
      const notificationData = {
        title: data.title,
        message: data.message,
        is_global: data.is_global,
        user_id: data.is_global ? null : data.user_id,
        action_type: data.action_type || null,
        action_link: data.action_link || null,
        image_url,
        read: false,
        created_at: new Date().toISOString()
      };
      const { error } = await supabase
        .from('notifications')
        .insert(notificationData);
      if (error) {
        console.error("Error creating notification:", error);
        throw error;
      }
      return { success: true };
    },
    onSuccess: () => {
      toast.success(isRtl ? "تم إنشاء الإشعار بنجاح" : "Notification created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      setIsDialogOpen(false);
      setNotificationTitle("");
      setNotificationMessage("");
      setIsGlobal(true);
      setSelectedUserId("");
      setActionType("");
      setActionLink("");
      setImageFile(null);
      setImagePreview(null);
    },
    onError: (error) => {
      console.error("Error creating notification:", error);
      toast.error(isRtl ? "حدث خطأ أثناء إنشاء الإشعار" : "Error creating notification");
    }
  });
  
  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) {
        console.error("Error deleting notification:", error);
        throw error;
      }
      
      return { success: true };
    },
    onSuccess: () => {
      toast.success(isRtl ? "تم حذف الإشعار بنجاح" : "Notification deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
    onError: (error) => {
      console.error("Error deleting notification:", error);
      toast.error(isRtl ? "حدث خطأ أثناء حذف الإشعار" : "Error deleting notification");
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isRtl ? "إدارة الإشعارات" : "Notifications Management"}</CardTitle>
        <CardDescription>
          {isRtl 
            ? "إنشاء وإدارة الإشعارات للمستخدمين" 
            : "Create and manage notifications for users"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={isRtl ? "البحث عن إشعار..." : "Search notifications..."}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {isRtl ? "إنشاء إشعار" : "Create Notification"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isRtl ? "إنشاء إشعار جديد" : "Create New Notification"}</DialogTitle>
                <DialogDescription>
                  {isRtl 
                    ? "إنشاء إشعار جديد للمستخدمين" 
                    : "Create a new notification for users"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="notification-type">
                    {isRtl ? "نوع الإشعار" : "Notification Type"}
                  </Label>
                  <Select
                    value={isGlobal ? "global" : "personal"}
                    onValueChange={(value) => {
                      setIsGlobal(value === "global");
                      if (value === "global") {
                        setSelectedUserId("");
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isRtl ? "اختر النوع" : "Select type"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">
                        {isRtl ? "عام" : "Global"}
                      </SelectItem>
                      <SelectItem value="personal">
                        {isRtl ? "شخصي" : "Personal"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {!isGlobal && (
                  <div className="space-y-2">
                    <Label htmlFor="user">
                      {isRtl ? "المستخدم" : "User"}
                    </Label>
                    <Select
                      value={selectedUserId}
                      onValueChange={setSelectedUserId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isRtl ? "اختر المستخدم" : "Select user"} />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.display_name} (@{user.username})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="title">
                    {isRtl ? "العنوان" : "Title"}
                  </Label>
                  <Input
                    id="title"
                    value={notificationTitle}
                    onChange={(e) => setNotificationTitle(e.target.value)}
                    placeholder={isRtl ? "عنوان الإشعار" : "Notification title"}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">
                    {isRtl ? "الرسالة" : "Message"}
                  </Label>
                  <Textarea
                    id="message"
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    placeholder={isRtl ? "محتوى الإشعار" : "Notification message"}
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="action-type">
                    {isRtl ? "نوع الإجراء (اختياري)" : "Action Type (Optional)"}
                  </Label>
                  <Input
                    id="action-type"
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    placeholder={isRtl ? "مثال: view_profile" : "Example: view_profile"}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="action-link">
                    {isRtl ? "رابط الإجراء (اختياري)" : "Action Link (Optional)"}
                  </Label>
                  <Input
                    id="action-link"
                    value={actionLink}
                    onChange={(e) => setActionLink(e.target.value)}
                    placeholder={isRtl ? "مثال: /profile/123" : "Example: /profile/123"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image-upload">
                    {isRtl ? "صورة (اختياري)" : "Image (Optional)"}
                  </Label>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="mt-2 rounded w-full max-h-40 object-cover" />
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  {isRtl ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  onClick={() => {
                    const notificationData = {
                      title: notificationTitle,
                      message: notificationMessage,
                      is_global: isGlobal,
                      user_id: isGlobal ? undefined : selectedUserId,
                      action_type: actionType || undefined,
                      action_link: actionLink || undefined,
                      image_file: imageFile || undefined
                    };
                    createNotificationMutation.mutate(notificationData);
                  }}
                  disabled={createNotificationMutation.isPending || !notificationTitle || !notificationMessage || (!isGlobal && !selectedUserId)}
                >
                  {createNotificationMutation.isPending
                    ? (isRtl ? "جاري الإنشاء..." : "Creating...")
                    : (isRtl ? "إنشاء" : "Create")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        {/* Explanatory note for admin */}
        <div className="mb-4 text-sm text-muted-foreground">
          {isRtl
            ? "يتم عرض الإشعارات التي أنشأها المسؤول فقط. تم استبعاد الإشعارات النظامية أو التي أنشأها المستخدمون."
            : "Only notifications created by admin are shown here. System and user-generated notifications are excluded."}
        </div>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="all">
              {isRtl ? "الكل" : "All"}
            </TabsTrigger>
            <TabsTrigger value="global">
              {isRtl ? "عام" : "Global"}
            </TabsTrigger>
            <TabsTrigger value="personal">
              {isRtl ? "شخصي" : "Personal"}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>{isRtl ? "جاري تحميل البيانات..." : "Loading data..."}</p>
          </div>
        ) : (
          <div className="rounded-md border mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRtl ? "العنوان" : "Title"}</TableHead>
                  <TableHead>{isRtl ? "الرسالة" : "Message"}</TableHead>
                  <TableHead>{isRtl ? "النوع" : "Type"}</TableHead>
                  <TableHead>{isRtl ? "المستخدم" : "User"}</TableHead>
                  <TableHead>{isRtl ? "أنشأها المسؤول" : "Admin Sender"}</TableHead>
                  <TableHead>{isRtl ? "الإجراء" : "Action"}</TableHead>
                  <TableHead>{isRtl ? "التاريخ" : "Date"}</TableHead>
                  <TableHead>{isRtl ? "الحالة" : "Status"}</TableHead>
                  <TableHead className="text-right">
                    {isRtl ? "الإجراءات" : "Actions"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotificationsSearch.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      {isRtl 
                        ? "لا توجد إشعارات متاحة" 
                        : "No notifications available"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNotificationsSearch.map(notification => (
                    <TableRow key={notification.id}>
                      <TableCell className="font-medium">
                        {notification.title}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={notification.message}>
                          {notification.message}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={notification.is_global ? "default" : "secondary"}>
                          {notification.is_global 
                            ? (isRtl ? "عام" : "Global") 
                            : (isRtl ? "شخصي" : "Personal")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {notification.user ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={notification.user.avatar_url} alt={notification.user.display_name} />
                              <AvatarFallback>{notification.user.display_name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{notification.user.display_name}</p>
                              <p className="text-xs text-muted-foreground">@{notification.user.username}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            {isRtl ? "جميع المستخدمين" : "All Users"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {notification.sender ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={notification.sender.avatar_url} alt={notification.sender.display_name} />
                              <AvatarFallback>{notification.sender.display_name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{notification.sender.display_name}</p>
                              <p className="text-xs text-muted-foreground">@{notification.sender.username}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {notification.action_type && notification.action_link ? (
                          <div className="flex items-center gap-1">
                            <Link className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {notification.action_type}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(notification.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={notification.read ? "outline" : "default"}>
                          {notification.read 
                            ? (isRtl ? "مقروء" : "Read") 
                            : (isRtl ? "غير مقروء" : "Unread")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(isRtl ? "هل أنت متأكد من حذف هذا الإشعار؟" : "Are you sure you want to delete this notification?")) {
                              deleteNotificationMutation.mutate(notification.id);
                            }
                          }}
                          title={isRtl ? "حذف" : "Delete"}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

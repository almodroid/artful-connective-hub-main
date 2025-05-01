import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  action_link?: string;
  action_type?: string;
  sender_id?: string;
  is_global: boolean;
  user_id: string;
}

export function useNotificationsApi() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  // Fetch notifications for the current user
  const {
    data: notifications,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async (): Promise<Notification[]> => {
      if (!isAuthenticated || !user) {
        return [];
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .or(`user_id.eq.${user.id},is_global.eq.true`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error);
        throw error;
      }

      return data || [];
    },
    enabled: isAuthenticated && !!user
  });

  // Mark notification as read
  const { mutate: markAsRead } = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!isAuthenticated || !user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error marking notification as read:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
    onError: (error) => {
      toast.error("Failed to mark notification as read");
      console.error(error);
    }
  });

  // Mark all notifications as read
  const { mutate: markAllAsRead } = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) {
        console.error("Error marking all notifications as read:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
      toast.success("جميع الإشعارات مقروءة");
    },
    onError: (error) => {
      toast.error("فشل في تحديث حالة الإشعارات");
      console.error(error);
    }
  });

  // Create notification (admin only)
  const createNotificationMutation = useMutation({
    mutationFn: async (notification: {
      user_id?: string;
      title: string;
      message: string;
      action_link?: string;
      action_type?: string;
      is_global: boolean;
    }) => {
      if (!isAuthenticated || !user?.isAdmin) {
        throw new Error("Unauthorized access");
      }

      setIsCreating(true);
      try {
        const { data, error } = await supabase
          .from("notifications")
          .insert({
            ...notification,
            user_id: notification.user_id || null,
            sender_id: user.id
          });

        if (error) {
          console.error("Error creating notification:", error);
          throw error;
        }

        return data;
      } finally {
        setIsCreating(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("تم إرسال الإشعار بنجاح");
    },
    onError: (error) => {
      toast.error("فشل في إرسال الإشعار");
      console.error(error);
    }
  });

  // Delete notification (admin only)
  const { mutate: deleteNotification } = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!isAuthenticated || !user?.isAdmin) {
        throw new Error("Unauthorized access");
      }

      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) {
        console.error("Error deleting notification:", error);
        throw error;
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("تم حذف الإشعار بنجاح");
    },
    onError: (error) => {
      toast.error("فشل في حذف الإشعار");
      console.error(error);
    }
  });

  // Send notification for new comment, like, or share
  const sendInteractionNotification = async (
    to_user_id: string,
    interaction_type: "like" | "comment" | "share" | "repost",
    content_id: string,
    content_type: "post" | "comment" | "project" | "reel"
  ) => {
    if (!isAuthenticated || !user) {
      console.log("User not authenticated, not sending notification");
      return;
    }

    if (to_user_id === user.id) {
      console.log("Not sending notification to self");
      return;
    }

    let title = "إشعار جديد";
    let message = "";
    let action_link = `/${content_type}/${content_id}`;
    
    switch (interaction_type) {
      case "like":
        title = "إعجاب جديد";
        message = `قام ${user.displayName} بالإعجاب بـ${content_type === "post" ? "منشورك" : content_type === "reel" ? "الريل الخاص بك" : "تعليقك"}`;
        break;
      case "comment":
        title = "تعليق جديد";
        message = `علق ${user.displayName} على ${content_type === "post" ? "منشورك" : content_type === "reel" ? "الريل الخاص بك" : "تعليقك"}`;
        break;
      case "share":
        title = "مشاركة جديدة";
        message = `قام ${user.displayName} بمشاركة ${content_type === "post" ? "منشورك" : content_type === "reel" ? "الريل الخاص بك" : "تعليقك"}`;
        break;
      case "repost":
        title = "إعادة نشر";
        message = `قام ${user.displayName} بإعادة نشر ${content_type === "post" ? "منشورك" : content_type === "reel" ? "الريل الخاص بك" : "تعليقك"}`;
        break;
    }

    try {
      const { data, error } = await supabase
        .from("notifications")
        .insert({
          user_id: to_user_id,
          title,
          message,
          action_link,
          action_type: interaction_type,
          sender_id: user.id,
          is_global: false
        });

      if (error) {
        console.error("Error sending interaction notification:", error);
      }

      return data;
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  };

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return {
    notifications: notifications || [],
    isLoading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    createNotification: createNotificationMutation.mutate,
    isCreating: isCreating || createNotificationMutation.isPending,
    deleteNotification,
    sendInteractionNotification,
    refetch
  };
}

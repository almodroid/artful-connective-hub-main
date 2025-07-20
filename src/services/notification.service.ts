import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { getNotificationPreferences } from "./notificationPreferences.service";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

interface NotificationPayload {
  user_id: string;
  title: string;
  message: string;
  action_link?: string;
  action_type?: string;
  sender_id: string;
}

/**
 * Creates a notification for post interactions (likes, comments)
 */
export const createPostNotification = async (
  recipientId: string,
  senderId: string,
  postId: string,
  action: "like" | "comment",
  senderName: string
): Promise<boolean> => {
  // Don't send notifications to yourself
  if (recipientId === senderId) {
    return false;
  }

  // Check push notification preference
  const prefs = await getNotificationPreferences(recipientId);
  if (prefs && prefs.push_enabled === false && prefs.email_enabled === false) {
    // User has disabled both push and email notifications
    return false;
  }

  try {
    // Get post details for more context
    const { data: post } = await supabase
      .from("posts")
      .select("title, content")
      .eq("id", postId)
      .single();

    // Prepare notification content
    const title = action === "like" ? "إعجاب جديد بمنشورك" : "تعليق جديد على منشورك";
    const postContentPreview = post?.content 
      ? post.content.substring(0, 50) + (post.content.length > 50 ? "..." : "") 
      : "منشورك";
    
    const message = action === "like" 
      ? `أعجب ${senderName} بمنشورك: "${postContentPreview}"`
      : `علق ${senderName} على منشورك: "${postContentPreview}"`;

    // Create notification record
    if (!prefs || prefs.push_enabled !== false) {
      const { error } = await supabase
        .from("notifications")
        .insert({
          user_id: recipientId,
          title,
          message,
          action_link: `/post/${postId}`,
          action_type: action,
          sender_id: senderId,
          is_global: false,
          read: false
        });
      if (error) {
        console.error("Error creating post notification:", error);
        return false;
      }
    }

    if (prefs && prefs.email_enabled) {
      // TODO: Implement sendEmailNotification(recipientId, title, message)
    }

    return true;
  } catch (error) {
    console.error("Error in createPostNotification:", error);
    return false;
  }
};

/**
 * Creates a notification for project interactions (likes, comments)
 */
export const createProjectNotification = async (
  recipientId: string,
  senderId: string,
  projectId: string,
  action: "like" | "comment" | "view",
  senderName: string
): Promise<boolean> => {
  // Don't send notifications to yourself
  if (recipientId === senderId) {
    return false;
  }

  // Check push notification preference
  const prefs = await getNotificationPreferences(recipientId);
  if (prefs && prefs.push_enabled === false && prefs.email_enabled === false) {
    // User has disabled both push and email notifications
    return false;
  }

  try {
    // Get project details for more context
    const { data: project } = await supabase
      .from("projects")
      .select("title")
      .eq("id", projectId)
      .single();

    // Prepare notification content
    let title: string;
    let message: string;
    
    if (action === "like") {
      title = "إعجاب جديد بمشروعك";
      message = `أعجب ${senderName} بمشروعك "${project?.title || 'مشروعك'}"`;
    } else if (action === "comment") {
      title = "تعليق جديد على مشروعك";
      message = `علق ${senderName} على مشروعك "${project?.title || 'مشروعك'}"`;
    } else { // view
      title = "مشاهدة جديدة لمشروعك";
      message = `شاهد ${senderName} مشروعك "${project?.title || 'مشروعك'}"`;
    }

    // Create notification record
    if (!prefs || prefs.push_enabled !== false) {
      const { error } = await supabase
        .from("notifications")
        .insert({
          user_id: recipientId,
          title,
          message,
          action_link: `/projects/${projectId}`,
          action_type: action,
          sender_id: senderId,
          is_global: false,
          read: false
        });
      if (error) {
        console.error("Error creating project notification:", error);
        return false;
      }
    }

    if (prefs && prefs.email_enabled) {
      // TODO: Implement sendEmailNotification(recipientId, title, message)
    }

    return true;
  } catch (error) {
    console.error("Error in createProjectNotification:", error);
    return false;
  }
};

/**
 * Creates a notification for reel interactions (likes, comments, views)
 */
export const createReelNotification = async (
  recipientId: string,
  senderId: string,
  reelId: string,
  action: "like" | "comment" | "view",
  senderName: string
): Promise<boolean> => {
  // Don't send notifications to yourself
  if (recipientId === senderId) {
    return false;
  }

  // Check push notification preference
  const prefs = await getNotificationPreferences(recipientId);
  if (prefs && prefs.push_enabled === false && prefs.email_enabled === false) {
    // User has disabled both push and email notifications
    return false;
  }

  try {
    // Get reel details for more context
    const { data: reel } = await supabase
      .from("reels")
      .select("caption")
      .eq("id", reelId)
      .single();

    // Prepare notification content
    let title: string;
    let message: string;
    
    if (action === "like") {
      title = "إعجاب جديد بالريل";
      message = `أعجب ${senderName} بالريل الخاص بك${reel?.caption ? `: "${reel.caption}"` : ''}`;
    } else if (action === "comment") {
      title = "تعليق جديد على الريل";
      message = `علق ${senderName} على الريل الخاص بك${reel?.caption ? `: "${reel.caption}"` : ''}`;
    } else { // view
      title = "مشاهدة جديدة للريل";
      message = `شاهد ${senderName} الريل الخاص بك${reel?.caption ? `: "${reel.caption}"` : ''}`;
    }

    // Create notification record
    if (!prefs || prefs.push_enabled !== false) {
      const { error } = await supabase
        .from("notifications")
        .insert({
          user_id: recipientId,
          title,
          message,
          action_link: `/reel/${reelId}`,
          action_type: action,
          sender_id: senderId,
          is_global: false,
          read: false
        });
      if (error) {
        console.error("Error creating reel notification:", error);
        return false;
      }
    }

    if (prefs && prefs.email_enabled) {
      // TODO: Implement sendEmailNotification(recipientId, title, message)
    }

    return true;
  } catch (error) {
    console.error("Error in createReelNotification:", error);
    return false;
  }
};



/**
 * Creates a notification for comment replies
 */
export const createCommentReplyNotification = async (
  recipientId: string,
  senderId: string,
  postId: string,
  commentId: string,
  senderName: string,
  replyContent: string
): Promise<boolean> => {
  // Don't send notifications to yourself
  if (recipientId === senderId) {
    return false;
  }

  // Check push notification preference
  const prefs = await getNotificationPreferences(recipientId);
  if (prefs && prefs.push_enabled === false && prefs.email_enabled === false) {
    // User has disabled both push and email notifications
    return false;
  }

  try {
    // Prepare notification content
    const title = "رد جديد على تعليقك";
    const message = `رد ${senderName} على تعليقك: "${replyContent.substring(0, 50) + (replyContent.length > 50 ? "..." : "")}"`;

    // Create notification record
    if (!prefs || prefs.push_enabled !== false) {
      const { error } = await supabase
        .from("notifications")
        .insert({
          user_id: recipientId,
          title,
          message,
          action_link: `/post/${postId}#comment-${commentId}`,
          action_type: "comment_reply",
          sender_id: senderId,
          is_global: false,
          read: false
        });
      if (error) {
        console.error("Error creating comment reply notification:", error);
        return false;
      }
    }

    if (prefs && prefs.email_enabled) {
      // TODO: Implement sendEmailNotification(recipientId, title, message)
    }

    return true;
  } catch (error) {
    console.error("Error in createCommentReplyNotification:", error);
    return false;
  }
};

/**
 * Marks a notification as read
 */
export const markNotificationAsRead = async (
  notificationId: string,
  userId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in markNotificationAsRead:", error);
    return false;
  }
};

/**
 * Marks all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (
  userId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      console.error("Error marking all notifications as read:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in markAllNotificationsAsRead:", error);
    return false;
  }
};

/**
 * Gets all notifications for a user
 */
export const getNotifications = async (
  userId: string,
  page = 1,
  limit = 20
): Promise<Notification[]> => {
  try {
    // Calculate offset
    const offset = (page - 1) * limit;
    
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .or(`user_id.eq.${userId},is_global.eq.true`)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getNotifications:", error);
    return [];
  }
};

/**
 * Gets unread notifications count for a user
 */
export const getUnreadNotificationsCount = async (
  userId: string
): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .or(`user_id.eq.${userId},is_global.eq.true`)
      .eq("read", false);

    if (error) {
      console.error("Error counting unread notifications:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("Error in getUnreadNotificationsCount:", error);
    return 0;
  }
}; 
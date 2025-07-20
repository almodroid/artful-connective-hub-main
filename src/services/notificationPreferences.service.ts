import { supabase } from "@/integrations/supabase/client";

export interface NotificationPreferences {
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  frequency: string;
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    console.error("Error fetching notification preferences:", error);
    return null;
  }
  return data as NotificationPreferences;
}

export async function upsertNotificationPreferences(userId: string, prefs: Partial<NotificationPreferences>): Promise<boolean> {
  const { error } = await supabase
    .from("notification_preferences")
    .upsert({ user_id: userId, ...prefs }, { onConflict: "user_id" });
  if (error) {
    console.error("Error updating notification preferences:", error);
    return false;
  }
  return true;
} 
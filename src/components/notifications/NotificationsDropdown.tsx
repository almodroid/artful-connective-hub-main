
import React, { useState } from "react";
import { Bell } from "lucide-react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import NotificationItem from "./NotificationItem";
import { useNotificationsApi } from "@/hooks/use-notifications-api";
import { useTranslation } from "@/hooks/use-translation";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const NotificationsDropdown = () => {
  const { t, isRtl } = useTranslation();
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    unreadCount,
    refetch
  } = useNotificationsApi();
  const { mutate: deleteNotification } = useMutation({
    mutationFn: async (notificationId: string) => {
      // Only delete personal notification (not admin/global)
      await supabase.from('notifications').delete().eq('id', notificationId);
    },
    onSuccess: () => {
      // Refetch notifications but do not close the dropdown
      refetch();
    },
  });
  const [open, setOpen] = useState(false);

  const handleTriggerClick = () => {
    refetch();
    setOpen(true);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          onClick={handleTriggerClick}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-2 w-2 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" >
        <div className="flex items-center justify-between border-b px-4 py-3" >
          <h3 className="font-medium">{t("notifications")}</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markAllAsRead()}
            >
              {t("markAllAsRead")}
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]" dir={isRtl ? "rtl" : "ltr"}>
          {notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={markAsRead}
                  onDismiss={id => deleteNotification(id)}
                  isRtl={isRtl}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <Bell className="h-10 w-10 text-muted-foreground mb-3 opacity-20" />
              <p className="text-muted-foreground">{t("noNotifications")}</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsDropdown;

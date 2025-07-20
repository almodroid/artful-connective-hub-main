
import React from "react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Bell, Heart, MessageCircle, Share2, RefreshCw, Globe, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Notification } from "@/hooks/use-notifications-api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onDismiss?: (id: string) => void;
  isRtl?: boolean;
}

const NotificationItem = ({ notification, onRead, onDismiss, isRtl }: NotificationItemProps) => {
  const [open, setOpen] = useState(false);
  const isAdminNotification = notification.is_global || (notification.sender && (notification.sender as any).is_admin);
  const handleClick = () => {
    if (!notification.read) {
      onRead(notification.id);
    }
    // If admin notification, open modal
    if (isAdminNotification) {
      setOpen(true);
    }
  };
  // Mark as read when modal opens
  const handleModalOpenChange = (openVal: boolean) => {
    setOpen(openVal);
    if (openVal && !notification.read) {
      onRead(notification.id);
    }
  };

  // Determine icon based on notification type
  const getIcon = () => {
    switch (notification.action_type) {
      case "like":
        return <Heart className="h-4 w-4 text-rose-500" />;
      case "comment":
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case "share":
        return <Share2 className="h-4 w-4 text-green-500" />;
      case "repost":
        return <RefreshCw className="h-4 w-4 text-purple-500" />;
      default:
        return notification.is_global ? 
          <Globe className="h-4 w-4 text-primary" /> : 
          <Bell className="h-4 w-4 text-primary" />;
    }
  };

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 p-3 cursor-pointer transition-colors rounded-md relative",
        notification.read 
          ? "hover:bg-muted/50" 
          : "bg-primary/5 hover:bg-primary/10",
        isAdminNotification ? "border-2 border-primary" : "border border-transparent",
      )}
      onClick={handleClick}
    >
      {notification.image_url && (
        <img src={notification.image_url} alt="Notification" className="max-h-24 rounded mb-2 object-cover" style={{ maxWidth: 96 }} />
      )}
      {/* Dismiss button (not for admin notifications) */}
      {!isAdminNotification && onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className={`absolute top-2 ${isRtl ? 'left-2' : 'right-2'} z-10`}
          onClick={e => {
            e.stopPropagation();
            onDismiss(notification.id);
          }}
          title="Dismiss"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
      )}
      <div className="flex-shrink-0 mt-1">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
          {getIcon()}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", !notification.read && "text-primary")}>
          {notification.title}
        </p>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { 
            addSuffix: true,
            locale: ar 
          })}
        </p>
      </div>
      {!notification.read && (
        <div className="flex-shrink-0 mt-1">
          <span className="block h-2 w-2 rounded-full bg-primary"></span>
        </div>
      )}
    </div>
  );

  return notification.action_link && !isAdminNotification ? (
    <Link to={notification.action_link}>
      {content}
    </Link>
  ) : (
    <>
      <div>{content}</div>
      {isAdminNotification && (
        <Dialog open={open} onOpenChange={handleModalOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{notification.title}</DialogTitle>
              {notification.image_url && (
                <img src={notification.image_url} alt="Notification" className="max-h-64 rounded mb-4 object-cover w-full" />
              )}
              <DialogDescription>{notification.message}</DialogDescription>
            </DialogHeader>
            <div className="mt-4 text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ar })}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default NotificationItem;

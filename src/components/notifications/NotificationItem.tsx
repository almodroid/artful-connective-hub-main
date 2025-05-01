
import React from "react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Bell, Heart, MessageCircle, Share2, RefreshCw, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Notification } from "@/hooks/use-notifications-api";

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
}

const NotificationItem = ({ notification, onRead }: NotificationItemProps) => {
  const handleClick = () => {
    if (!notification.read) {
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
        "flex items-start gap-3 p-3 cursor-pointer transition-colors rounded-md",
        notification.read 
          ? "hover:bg-muted/50" 
          : "bg-primary/5 hover:bg-primary/10"
      )}
      onClick={handleClick}
    >
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

  return notification.action_link ? (
    <Link to={notification.action_link}>
      {content}
    </Link>
  ) : (
    content
  );
};

export default NotificationItem;

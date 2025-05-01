
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/hooks/use-chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FormattedText } from "@/components/ui-custom/FormattedText";
import { useTranslation } from "@/hooks/use-translation";
import { useAuth } from "@/contexts/AuthContext";

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const { isRtl } = useTranslation();
  const { user } = useAuth();
  const isUser = message.role === "user";
  
  return (
    <div className={cn(
      "flex gap-3 w-full max-w-full",
      isUser ? "justify-end" : "justify-start"
    )}>
      {!isUser && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src="/arter-avatar.png" />
          <AvatarFallback>Ar</AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "rounded-lg p-3 text-sm max-w-[80%]",
        isUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted"
      )}>
        <FormattedText text={message.content} />
      </div>
      
      {isUser && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src={user?.avatar} />
          <AvatarFallback>{user?.displayName?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

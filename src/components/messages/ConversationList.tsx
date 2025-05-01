import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/use-translation";
import { Link, useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  last_message_at: string;
  participants: {
    user_id: string;
    profile: {
      username: string;
      avatar_url: string;
    };
  }[];
  last_message: {
    content: string;
    media_type: string;
    sender_id: string;
  } | null;
}

export function ConversationList() {
  const { user } = useAuth();
  const { isRtl } = useTranslation();
  const { conversationId } = useParams();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          last_message_at,
          participants:conversation_participants(
            user_id,
            profile:profiles(
              username,
              avatar_url
            )
          ),
          last_message:messages(
            content,
            media_type,
            sender_id
          )
        `)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      return data as Conversation[];
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-3 w-[100px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="divide-y">
      {conversations?.map((conversation) => {
        const otherParticipant = conversation.participants.find(
          p => p.user_id !== user?.id
        );

        if (!otherParticipant) return null;

        const lastMessage = conversation.last_message;
        const isLastMessageFromMe = lastMessage?.sender_id === user?.id;

        return (
          <Link
            key={conversation.id}
            to={`/messages/${conversation.id}`}
            className={cn(
              "flex items-center space-x-4 p-4 hover:bg-muted/50 transition-colors",
              conversationId === conversation.id && "bg-muted"
            )}
          >
            <Avatar>
              <AvatarImage src={otherParticipant.profile.avatar_url} />
              <AvatarFallback>
                {otherParticipant.profile.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <p className="font-medium truncate">
                  {otherParticipant.profile.username}
                </p>
                {conversation.last_message_at && (
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(conversation.last_message_at), {
                      addSuffix: true
                    })}
                  </span>
                )}
              </div>

              {lastMessage && (
                <p className="text-sm text-muted-foreground truncate">
                  {isLastMessageFromMe && (isRtl ? "أنت: " : "You: ")}
                  {lastMessage.media_type === 'text'
                    ? lastMessage.content
                    : `[${lastMessage.media_type}]`}
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
} 
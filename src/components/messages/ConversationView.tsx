import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/use-translation";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreVertical, Send, Image, Video, Mic, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { createMessageNotification } from "@/services/notification.service";
import { v4 as uuidv4 } from "uuid";

interface Message {
  id: string;
  content: string;
  media_url: string | null;
  media_type: string;
  sender_id: string;
  created_at: string;
  is_edited: boolean;
  edited_at: string | null;
  deleted_at: string | null;
  sender: {
    username: string;
    avatar_url: string;
  };
}

interface ConversationViewProps {
  conversationId: string;
}

export function ConversationView({ conversationId }: ConversationViewProps) {
  const { user } = useAuth();
  const { isRtl } = useTranslation();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | "audio" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: conversation, isLoading: isLoadingConversation } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          participants:conversation_participants(
            user_id,
            profile:profiles(
              username,
              avatar_url
            )
          )
        `)
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      return data;
    }
  });

  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          media_url,
          media_type,
          sender_id,
          created_at,
          is_edited,
          edited_at,
          deleted_at,
          sender:profiles(
            username,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; mediaFile?: File; mediaType?: string }) => {
      if (!data.content && !data.mediaFile) {
        throw new Error("Message cannot be empty");
      }

      try {
        let mediaUrl = null;
        let mediaType = data.mediaType || null;

        // If a media file is provided, upload it first
        if (data.mediaFile) {
          const fileExt = data.mediaFile.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${conversationId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('messages')
            .upload(filePath, data.mediaFile);

          if (uploadError) throw uploadError;

          const { data: fileData } = supabase.storage
            .from('messages')
            .getPublicUrl(filePath);

          mediaUrl = fileData.publicUrl;
          
          // If media type is not explicitly provided, try to determine it
          if (!mediaType) {
            if (fileExt && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt.toLowerCase())) {
              mediaType = 'image';
            } else if (fileExt && ['mp4', 'webm', 'mov'].includes(fileExt.toLowerCase())) {
              mediaType = 'video';
            } else {
              mediaType = 'file';
            }
          }
        }

        // Create message
        const { data: messageData, error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            content: data.content,
            media_url: mediaUrl,
            media_type: mediaType,
            sender_id: user?.id
          })
          .select()
          .single();

        if (error) throw error;
        
        // Get conversation participants to send notifications
        const { data: participants, error: participantsError } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", conversationId)
          .neq("user_id", user!.id);  // Exclude the sender
          
        if (participantsError) {
          console.error("Error getting conversation participants:", participantsError);
        } else if (participants && participants.length > 0) {
          // Send notification to each participant
          try {
            // Get sender display name for notification
            const senderName = user?.displayName || user?.username || "Unknown User";
            const messagePreview = data.content || "Sent a media file";
            
            // Send notifications to all participants
            for (const participant of participants) {
              await createMessageNotification(
                participant.user_id,
                user!.id,
                conversationId,
                senderName,
                messagePreview
              );
            }
          } catch (notifyError) {
            console.error("Error sending message notification:", notifyError);
            // Continue even if notification fails
          }
        }

        // Invalidate queries to refresh messages
        queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        
        return messageData;
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Clear input after successful send
      setMessage("");
      setMediaFile(null);
      setMediaType(null);
      // Update conversation list to show this conversation at the top
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast.error(isRtl ? "حدث خطأ أثناء إرسال الرسالة" : "Error sending message");
    }
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString(), deleted_by: user?.id })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error) => {
      console.error('Error deleting message:', error);
      toast.error(isRtl ? "حدث خطأ أثناء حذف الرسالة" : "Error deleting message");
    }
  });

  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      const { error } = await supabase
        .from('messages')
        .update({
          content,
          is_edited: true,
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
    onError: (error) => {
      console.error('Error editing message:', error);
      toast.error(isRtl ? "حدث خطأ أثناء تعديل الرسالة" : "Error editing message");
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileType = file.type.split('/')[0];
    if (fileType === 'image' || fileType === 'video' || fileType === 'audio') {
      setMediaFile(file);
      setMediaType(fileType as "image" | "video" | "audio");
    } else {
      toast.error(isRtl ? "نوع الملف غير مدعوم" : "Unsupported file type");
    }
  };

  const handleSend = () => {
    if (!message.trim() && !mediaFile) return;

    sendMessageMutation.mutate({
      content: message,
      mediaFile: mediaFile || undefined,
      mediaType: mediaType || undefined
    });
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoadingConversation || isLoadingMessages) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const otherParticipant = conversation?.participants.find(
    p => p.user_id !== user?.id
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={otherParticipant?.profile.avatar_url} />
            <AvatarFallback>
              {otherParticipant?.profile.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-medium">{otherParticipant?.profile.username}</h2>
            <p className="text-sm text-muted-foreground">
              {isRtl ? "متصل" : "Online"}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              {isRtl ? "حظر المستخدم" : "Block User"}
            </DropdownMenuItem>
            <DropdownMenuItem>
              {isRtl ? "حذف المحادثة" : "Delete Conversation"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.map((message) => {
          if (message.deleted_at) return null;

          const isMyMessage = message.sender_id === user?.id;

          return (
            <div
              key={message.id}
              className={`flex items-start space-x-4 ${
                isMyMessage ? "flex-row-reverse space-x-reverse" : ""
              }`}
            >
              <Avatar>
                <AvatarImage src={message.sender.avatar_url} />
                <AvatarFallback>
                  {message.sender.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className={`flex-1 max-w-[70%] ${isMyMessage ? "text-right" : ""}`}>
                <div
                  className={`inline-block p-3 rounded-lg ${
                    isMyMessage
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.media_url && (
                    <div className="mb-2">
                      {message.media_type === 'image' && (
                        <img
                          src={message.media_url}
                          alt=""
                          className="max-w-full rounded-lg"
                        />
                      )}
                      {message.media_type === 'video' && (
                        <video
                          src={message.media_url}
                          controls
                          className="max-w-full rounded-lg"
                        />
                      )}
                      {message.media_type === 'audio' && (
                        <audio src={message.media_url} controls className="w-full" />
                      )}
                    </div>
                  )}
                  {message.content}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(message.created_at), {
                    addSuffix: true
                  })}
                  {message.is_edited && (
                    <span className="ml-1">
                      {isRtl ? "(تم التعديل)" : "(edited)"}
                    </span>
                  )}
                </div>
              </div>

              {isMyMessage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        const newContent = prompt(
                          isRtl ? "تعديل الرسالة" : "Edit message",
                          message.content
                        );
                        if (newContent && newContent !== message.content) {
                          editMessageMutation.mutate({
                            messageId: message.id,
                            content: newContent
                          });
                        }
                      }}
                    >
                      {isRtl ? "تعديل" : "Edit"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => deleteMessageMutation.mutate(message.id)}
                    >
                      {isRtl ? "حذف" : "Delete"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        {mediaFile && (
          <div className="mb-4 flex items-center justify-between bg-muted p-2 rounded-lg">
            <div className="flex items-center space-x-2">
              {mediaType === 'image' && <Image className="h-4 w-4" />}
              {mediaType === 'video' && <Video className="h-4 w-4" />}
              {mediaType === 'audio' && <Mic className="h-4 w-4" />}
              <span className="text-sm truncate">{mediaFile.name}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setMediaFile(null);
                setMediaType(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isRtl ? "اكتب رسالة..." : "Type a message..."}
              className="min-h-[80px] resize-none"
            />
          </div>
          <div className="flex flex-col space-y-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,video/*,audio/*"
              onChange={handleFileSelect}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
            >
              <Image className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleSend}
              disabled={sendMessageMutation.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 
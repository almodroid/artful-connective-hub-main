import { useRef, useEffect, useState, useCallback } from "react";
import { ChatMessage } from "@/hooks/use-chat";
import { Palette, Brush, Wand, Layers, User, Bot, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Json } from "@/types/supabase";

interface ChatContainerProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onClearChat: () => void;
  onPollMessages?: () => Promise<void>;
  pollInterval?: number;
  onLoadMessages?: (messages: ChatMessage[]) => void;
  onSaveConversation?: () => void;
}


export function ChatContainer({
  messages,
  isLoading,
  onSendMessage,
  onClearChat,
  onPollMessages,
  pollInterval = 3000,
  onLoadMessages,
  onSaveConversation
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { t, isRtl } = useTranslation();
  const { user } = useAuth();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingTimeoutRef = useRef<NodeJS.Timeout>();

  // Save current conversation to Supabase
  const saveConversation = async () => {
    if (messages.length === 0 || !user) return;
    const newConversation = {
      user_id: user.id,
      messages: messages as unknown as Json,
      created_at: new Date().toISOString()
    };
    // Insert new chat history
    const { error } = await supabase
      .from('chat_history')
      .insert([newConversation]);

    if (!error) {
      if (onSaveConversation) onSaveConversation();
    }
  };


  // Suggestions for new users
  const suggestions = [
    {
      text: t("suggestColorPalette"),
      icon: <Palette className="h-4 w-4 text-purple-500" />,
    },
    {
      text: t("suggestDesignFeedback"),
      icon: <Brush className="h-4 w-4 text-purple-500" />,
    },
    {
      text: t("suggestCreativeSolution"),
      icon: <Wand className="h-4 w-4 text-purple-500" />,
    },
    {
      text: t("suggestComposition"),
      icon: <Layers className="h-4 w-4 text-purple-500" />,
    },
  ];

  // Poll for new messages
  const pollForMessages = useCallback(async () => {
    if (!onPollMessages || isPolling) return;

    try {
      setIsPolling(true);
      await onPollMessages();
    } catch (error) {
      console.error('Error polling for messages:', error);
    } finally {
      setIsPolling(false);
    }
  }, [onPollMessages, isPolling]);

  // Set up polling interval
  useEffect(() => {
    if (!onPollMessages) return;

    const startPolling = () => {
      pollingTimeoutRef.current = setInterval(pollForMessages, pollInterval);
    };

    const stopPolling = () => {
      if (pollingTimeoutRef.current) {
        clearInterval(pollingTimeoutRef.current);
      }
    };

    // Start polling when component mounts
    startPolling();

    // Stop polling when component unmounts
    return () => {
      stopPolling();
    };
  }, [onPollMessages, pollInterval, pollForMessages]);

  // Track last message for new message detection
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.id !== lastMessageId) {
        setLastMessageId(lastMessage.id);
        // Scroll to bottom when new message arrives
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: "smooth"
          });
        }
      }
    }
  }, [messages, lastMessageId]);

  // Handle keyboard visibility
  useEffect(() => {
    const handleResize = () => {
      // Check if we're on a mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (!isMobile) return;

      // Get the viewport height
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;

      // If viewport height is significantly smaller than window height, keyboard is likely open
      const keyboardOpen = viewportHeight < windowHeight * 0.8;

      if (isKeyboardVisible && !keyboardOpen) {
        // Keyboard just closed, scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      setIsKeyboardVisible(keyboardOpen);
    };

    // Use visualViewport API if available
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    } else {
      // Fallback to window resize
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, [isKeyboardVisible]);

  const renderMessage = (message: ChatMessage) => {
    const isNewMessage = message.id === lastMessageId;

    return (
      <div
        key={message.id}
        className={cn(
          "flex items-start gap-3",
          message.role === "user"
            ? isRtl ? "mr-auto" : "ml-auto"
            : isRtl ? "ml-auto" : "mr-auto",
          isRtl && message.role === "user" ? "flex-row" : isRtl ? "flex-row-reverse" : "flex-row",
          isNewMessage && "animate-fade-in"
        )}
      >
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
          message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          {message.role === "user" ? (
            <User className="w-4 h-4" />
          ) : (
            <Bot className="w-4 h-4" />
          )}
        </div>
        <div className={cn(
          "rounded-lg p-3 break-words",
          message.role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted",
          isRtl ? "text-right" : "text-left"
        )}>
          <p className="whitespace-pre-wrap overflow-x-auto">{message.content}</p>
          <span className="text-xs opacity-70 mt-1 block">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>
    );
  };


  return (
    <div className="flex flex-col h-full overflow-hidden">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-8 text-center ">
          <div className="space-y-2">
            <p className="text-muted-foreground max-w-md text-center">
              {t("spaceAIDescription")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                className={cn(
                  "justify-start text-left",
                  isRtl && "text-right"
                )}
                onClick={() => onSendMessage(suggestion.text)}
                disabled={isLoading}
              >
                {suggestion.icon}
                <span className="truncate">{suggestion.text}</span>
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className={cn(
            "flex justify-end p-2 sticky top-0 bg-background z-10 border-b",
            isRtl && "flex-row-reverse"
          )}>
            <Button
              variant="outline"
              size="sm"
              onClick={saveConversation}
              className={cn("mr-2", isRtl && "mr-0 ml-2")}
              title={t("saveCurrentChat")}
            >
              <Save className="h-4 w-4 mr-2" />
              {t("saveChat")}
            </Button>
          </div>

          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="space-y-4">
              {messages.map(renderMessage)}
              {isLoading && (
                <div className={cn(
                  "flex items-start gap-3",
                  isRtl ? "ml-auto" : "mr-auto",
                  isRtl ? "flex-row-reverse" : "flex-row"
                )}>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="rounded-lg p-3 bg-muted">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce delay-100" />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useRef, useEffect, useState, useCallback } from "react";
import { ChatMessage } from "@/hooks/use-chat";
import { Palette, Brush, Wand, Layers, User, Bot, Save, History, Trash2, Search, ArrowUpDown, Tag, Check } from "lucide-react";
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

interface SavedConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
  tags?: string[];
}

interface ChatContainerProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onClearChat: () => void;
  onPollMessages?: () => Promise<void>;
  pollInterval?: number;
  onLoadMessages?: (messages: ChatMessage[]) => void;
}

type SortOption = 'newest' | 'oldest' | 'title';

export function ChatContainer({ 
  messages, 
  isLoading, 
  onSendMessage, 
  onClearChat,
  onPollMessages,
  pollInterval = 3000,
  onLoadMessages
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { t, isRtl } = useTranslation();
  const { user } = useAuth();
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Get unique tags from all conversations
  const allTags = Array.from(new Set(
    savedConversations.flatMap(conv => conv.tags || [])
  ));

  // Filter and sort conversations
  const filteredConversations = savedConversations
    .filter(conv => {
      const matchesSearch = conv.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !selectedTag || (conv.tags || []).includes(selectedTag);
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.timestamp - a.timestamp;
        case 'oldest':
          return a.timestamp - b.timestamp;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  // Helper function to format relative time
  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return t("justNow");
    if (minutes < 60) return `${minutes} ${t("minutesAgo")}`;
    if (hours < 24) return `${hours} ${t("hoursAgo")}`;
    return `${days} ${t("daysAgo")}`;
  };

  // Fetch chat history from Supabase on mount
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('chat_history')
        .select('id, messages, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        // Convert Supabase rows to SavedConversation[]
        const conversations = data.map((row: any) => ({
          id: row.id,
          title: row.messages?.[0]?.content?.slice(0, 30) + '...' || 'Conversation',
          messages: row.messages || [],
          timestamp: new Date(row.created_at).getTime(),
          tags: [] // You can extend schema to support tags if needed
        }));
        setSavedConversations(conversations);
      }
    };
    fetchChatHistory();
  }, [user]);

  // Save current conversation to Supabase
  const saveConversation = async () => {
    if (messages.length === 0 || !user) return;
    const newConversation = {
      user_id: user.id,
      messages: messages as unknown as Json,
      created_at: new Date().toISOString()
    };
    // Insert new chat history
    const { data, error } = await supabase
      .from('chat_history')
      .insert([newConversation]) as { data: { id: string; created_at: string }[], error: any };
    if (!error && data) {
      setSavedConversations(prev => [
        {
          id: data[0].id,
          title: messages[0].content.slice(0, 30) + '...',
          messages: messages,
          timestamp: new Date(data[0].created_at).getTime(),
          tags: []
        },
        ...prev
      ]);
    }
  };

  // Add tag to conversation
  const addTag = (conversationId: string, tag: string) => {
    const updated = savedConversations.map(conv => {
      if (conv.id === conversationId) {
        const tags = new Set([...(conv.tags || []), tag]);
        return { ...conv, tags: Array.from(tags) };
      }
      return conv;
    });
    setSavedConversations(updated);
    // Update Supabase if you want to persist tags
  };

  // Remove tag from conversation
  const removeTag = (conversationId: string, tag: string) => {
    const updated = savedConversations.map(conv => {
      if (conv.id === conversationId) {
        const tags = (conv.tags || []).filter(t => t !== tag);
        return { ...conv, tags };
      }
      return conv;
    });
    setSavedConversations(updated);
    // Update Supabase if you want to persist tags
  };

  // Load a saved conversation
  const loadConversation = (conversation: SavedConversation) => {
    if (onLoadMessages) {
      // If we have a direct message loader, use it
      onLoadMessages(conversation.messages);
    } else {
      // Fallback to the old behavior if no loader is provided
      const shouldContinue = messages.length > 0;
      
      if (shouldContinue) {
        // Add a separator message to indicate continuation
        const separatorMessage: ChatMessage = {
          id: `separator-${Date.now()}`,
          role: "assistant",
          content: t("continuingConversation"),
          timestamp: new Date()
        };
        
        // Add the separator and then the conversation messages
        onSendMessage(separatorMessage.content);
        conversation.messages.forEach(msg => {
          if (msg.role === 'user') {
            onSendMessage(msg.content);
          }
        });
      } else {
        // If no current conversation, just load the saved one
        conversation.messages.forEach(msg => {
          if (msg.role === 'user') {
            onSendMessage(msg.content);
          }
        });
      }
    }
    
    setShowHistory(false);
  };

  // Delete a saved conversation
  const deleteConversation = (id: string) => {
    const updated = savedConversations.filter(conv => conv.id !== id);
    setSavedConversations(updated);
    // Update Supabase if you want to persist tags
  };

  // Suggestions for new users
  const suggestions = [
    {
      text: t("suggestColorPalette"),
      icon: <Palette className="h-4 w-4" />,
    },
    {
      text: t("suggestDesignFeedback"),
      icon: <Brush className="h-4 w-4" />,
    },
    {
      text: t("suggestCreativeSolution"),
      icon: <Wand className="h-4 w-4" />,
    },
    {
      text: t("suggestComposition"),
      icon: <Layers className="h-4 w-4" />,
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

  const renderHistoryPanel = () => (
    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
      <div className={cn("flex gap-2 sticky top-0 bg-background z-20 p-2", isRtl && "flex-row-reverse")}>
        <div className="relative flex-1">
          <Search className={cn(
            "absolute h-4 w-4 text-muted-foreground",
            isRtl ? "right-2" : "left-2",
            "top-2.5"
          )} />
          <Input
            placeholder={t("searchConversations")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn("pl-8", isRtl && "pl-0 pr-8")}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRtl ? "start" : "end"}>
            <DropdownMenuItem 
              onClick={() => setSortBy('newest')}
              dir={isRtl ? "rtl" : "ltr"}
              className="flex justify-between items-center"
            >
              <span>{isRtl ? "الأحدث" : "Newest"}</span>
              {sortBy === 'newest' && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSortBy('oldest')}
              dir={isRtl ? "rtl" : "ltr"}
              className="flex justify-between items-center"
            >
              <span>{isRtl ? "الأقدم" : "Oldest"}</span>
              {sortBy === 'oldest' && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSortBy('title')}
              dir={isRtl ? "rtl" : "ltr"}
              className="flex justify-between items-center"
            >
              <span>{isRtl ? "العنوان" : "Title"}</span>
              {sortBy === 'title' && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1 p-2 sticky top-[72px] bg-background z-10">
          {allTags.map(tag => (
            <Button
              key={tag}
              variant={selectedTag === tag ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            >
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </Button>
          ))}
        </div>
      )}

      {filteredConversations.length > 0 ? (
        <div className="space-y-2 p-2">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className="flex items-center justify-between p-2 bg-muted rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left",
                    isRtl && "text-right"
                  )}
                  onClick={() => loadConversation(conv)}
                >
                  <div className={cn(
                    "flex flex-col items-start w-full",
                    isRtl && "items-end"
                  )}>
                    <span className="truncate font-medium">{conv.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {t("lastSaved")}: {formatRelativeTime(conv.timestamp)}
                    </span>
                    {conv.tags && conv.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {conv.tags.map(tag => (
                          <span
                            key={tag}
                            className="text-xs bg-background px-1.5 py-0.5 rounded"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTag(conv.id, tag);
                            }}
                          >
                            {tag} ×
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Button>
              </div>
              <div className={cn("flex gap-1 shrink-0", isRtl && "flex-row-reverse")}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Tag className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isRtl ? "start" : "end"}>
                    {allTags.map(tag => (
                      <DropdownMenuItem
                        key={tag}
                        onClick={() => addTag(conv.id, tag)}
                      >
                        {tag}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteConversation(conv.id)}
                  title={t("deleteConversation")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-4">
          {searchQuery || selectedTag ? t("noMatchingConversations") : t("noSavedConversations")}
        </div>
      )}
    </div>
  );

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

          {savedConversations.length > 0 ? (
            <div className="w-full max-w-md mt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowHistory(!showHistory)}
              >
                <History className="h-4 w-4 mr-2" />
                {t("chatHistory")}
              </Button>
              
              {showHistory && (
                <div className="mt-2 bg-muted rounded-lg">
                  {renderHistoryPanel()}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full max-w-md mt-4 text-center text-muted-foreground">
              {t("noSavedConversations")}
            </div>
          )}
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              title={t("chatHistory")}
            >
              <History className="h-4 w-4 mr-2" />
              {t("chatHistory")}
            </Button>
          </div>

          {showHistory && (
            <div className="border-b">
              {renderHistoryPanel()}
            </div>
          )}

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

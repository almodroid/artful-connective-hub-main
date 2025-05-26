import { useRef, useEffect, useState } from "react";
import { ChatMessage } from "@/hooks/use-chat";
import { Palette, Brush, Wand, Layers, User, Bot, Save, History, Trash2, Search, ArrowUpDown, Tag } from "lucide-react";
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
}

type SortOption = 'newest' | 'oldest' | 'title';

export function ChatContainer({ messages, isLoading, onSendMessage, onClearChat }: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t, isRtl } = useTranslation();
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>(() => {
    const saved = localStorage.getItem('savedConversations');
    return saved ? JSON.parse(saved) : [];
  });
  const [showHistory, setShowHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
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

  // Save current conversation
  const saveConversation = () => {
    if (messages.length === 0) return;
    
    const newConversation: SavedConversation = {
      id: Date.now().toString(),
      title: messages[0].content.slice(0, 30) + '...',
      messages: [...messages],
      timestamp: Date.now(),
      tags: []
    };
    
    const updated = [newConversation, ...savedConversations];
    setSavedConversations(updated);
    localStorage.setItem('savedConversations', JSON.stringify(updated));
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
    localStorage.setItem('savedConversations', JSON.stringify(updated));
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
    localStorage.setItem('savedConversations', JSON.stringify(updated));
  };

  // Load a saved conversation
  const loadConversation = (conversation: SavedConversation) => {
    // Instead of clearing, we'll check if we're continuing or starting fresh
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
    
    setShowHistory(false);
  };

  // Delete a saved conversation
  const deleteConversation = (id: string) => {
    const updated = savedConversations.filter(conv => conv.id !== id);
    setSavedConversations(updated);
    localStorage.setItem('savedConversations', JSON.stringify(updated));
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

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth"
        });
      }
    }
  }, [messages]);

  const renderMessage = (message: ChatMessage) => (
    <div
      key={message.id}
      className={cn(
        "flex items-start gap-3 ",
        message.role === "user" 
          ? isRtl ? "mr-auto" : "ml-auto"
          : isRtl ? "ml-auto" : "mr-auto",
        isRtl && message.role === "user" ? "flex-row" : isRtl ? "flex-row-reverse" : "flex-row"
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
        "rounded-lg p-3",
        message.role === "user" 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted",
        isRtl ? "text-right" : "text-left"
      )}>
        <p className="whitespace-pre-wrap">{message.content}</p>
        <span className="text-xs opacity-70 mt-1 block">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );

  const renderHistoryPanel = () => (
    <div className="space-y-2">
      <div className={cn("flex gap-2", isRtl && "flex-row-reverse")}>
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
            <DropdownMenuItem onClick={() => setSortBy('newest')}>
              {t("sortByNewest")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('oldest')}>
              {t("sortByOldest")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('title')}>
              {t("sortByTitle")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
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
        <div className="space-y-2">
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
                    "flex flex-col items-start",
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
              <div className={cn("flex gap-1", isRtl && "flex-row-reverse")}>
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
    <div className="flex flex-col h-full">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-8 text-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{t("meetSpaceAI")}</h2>
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
              
              {showHistory && renderHistoryPanel()}
            </div>
          ) : (
            <div className="w-full max-w-md mt-4 text-center text-muted-foreground">
              {t("noSavedConversations")}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 relative">
          <div className={cn(
            "flex justify-end mb-2 sticky top-0 bg-background z-10 pb-2",
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
            <div className="mb-4 p-2 bg-muted rounded-lg sticky top-12 bg-background z-10">
              {renderHistoryPanel()}
            </div>
          )}

          <div className="space-y-4">
            {messages.map(renderMessage)}
            {isLoading && (
              <div className={cn(
                "flex items-start gap-3 ",
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
      )}
    </div>
  );
}

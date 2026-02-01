import { useState, useEffect } from "react";
import { ChatMessage } from "@/hooks/use-chat";
import { History, Trash2, Search, ArrowUpDown, Tag, Check, Plus } from "lucide-react";
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

export interface SavedConversation {
    id: string;
    title: string;
    messages: ChatMessage[];
    timestamp: number;
    tags?: string[];
}

interface ChatHistorySidebarProps {
    onLoadConversation: (messages: ChatMessage[]) => void;
    onNewChat: () => void;
    className?: string;
}

type SortOption = 'newest' | 'oldest' | 'title';

export function ChatHistorySidebar({ onLoadConversation, onNewChat, className }: ChatHistorySidebarProps) {
    const { t, isRtl } = useTranslation();
    const { user } = useAuth();
    const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
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

        if (minutes < 1) return t("justNow") || "Just now";
        if (minutes < 60) return `${minutes} ${t("minutesAgo") || "mins ago"}`;
        if (hours < 24) return `${hours} ${t("hoursAgo") || "hours ago"}`;
        return `${days} ${t("daysAgo") || "days ago"}`;
    };

    // Fetch chat history from Supabase
    useEffect(() => {
        const fetchChatHistory = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from('chat_history')
                .select('id, messages, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (!error && data) {
                const conversations = data.map((row: any) => ({
                    id: row.id,
                    title: row.messages?.[0]?.content?.slice(0, 30) + '...' || 'Conversation',
                    messages: row.messages || [],
                    timestamp: new Date(row.created_at).getTime(),
                    tags: []
                }));
                setSavedConversations(conversations);
            }
        };
        fetchChatHistory();
    }, [user]);

    const deleteConversation = async (id: string) => {
        if (!user) return;
        const { error } = await supabase
            .from('chat_history')
            .delete()
            .eq('id', id);

        if (!error) {
            setSavedConversations(prev => prev.filter(conv => conv.id !== id));
        }
    };

    const addTag = (conversationId: string, tag: string) => {
        const updated = savedConversations.map(conv => {
            if (conv.id === conversationId) {
                const tags = new Set([...(conv.tags || []), tag]);
                return { ...conv, tags: Array.from(tags) };
            }
            return conv;
        });
        setSavedConversations(updated);
    };

    const removeTag = (conversationId: string, tag: string) => {
        const updated = savedConversations.map(conv => {
            if (conv.id === conversationId) {
                const tags = (conv.tags || []).filter(t => t !== tag);
                return { ...conv, tags };
            }
            return conv;
        });
        setSavedConversations(updated);
    };

    return (
        <div className={cn("flex flex-col h-full bg-card border-e w-72 lg:w-80", className)}>
            <div className="p-4 border-b space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-display font-bold text-lg flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        {t("chatHistory") || "Chat History"}
                    </h2>
                    <Button variant="ghost" size="icon" onClick={onNewChat} title={t("newChat") || "New Chat"}>
                        <Plus className="h-5 w-5" />
                    </Button>
                </div>

                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className={cn(
                            "absolute h-4 w-4 text-muted-foreground top-3",
                            isRtl ? "right-3" : "left-3"
                        )} />
                        <Input
                            placeholder={t("searchConversations") || "Search..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={cn("bg-background/50", isRtl ? "pr-9" : "pl-9")}
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
                                <span className="flex-1">{isRtl ? "الأحدث" : "Newest"}</span>
                                {sortBy === 'newest' && <Check className="h-4 w-4 ml-2" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                                <span className="flex-1">{isRtl ? "الأقدم" : "Oldest"}</span>
                                {sortBy === 'oldest' && <Check className="h-4 w-4 ml-2" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy('title')}>
                                <span className="flex-1">{isRtl ? "العنوان" : "Title"}</span>
                                {sortBy === 'title' && <Check className="h-4 w-4 ml-2" />}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 p-2">
                        {allTags.map(tag => (
                            <Button
                                key={tag}
                                variant={selectedTag === tag ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                                className="h-7 text-xs"
                            >
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                            </Button>
                        ))}
                    </div>
                )}

                {filteredConversations.length > 0 ? (
                    filteredConversations.map((conv) => (
                        <div
                            key={conv.id}
                            className="group relative flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer"
                            onClick={() => onLoadConversation(conv.messages)}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col items-start text-start">
                                    <span className="truncate font-medium text-sm w-full">{conv.title}</span>
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                        {formatRelativeTime(conv.timestamp)}
                                    </span>
                                </div>
                                {conv.tags && conv.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {conv.tags.map(tag => (
                                            <span
                                                key={tag}
                                                className="text-[10px] bg-background border px-1.5 py-0.5 rounded flex items-center gap-1"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeTag(conv.id, tag);
                                                }}
                                            >
                                                {tag} <span className="opacity-50 hover:opacity-100 pb-0.5">×</span>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteConversation(conv.id);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-muted-foreground py-8 text-sm">
                        {searchQuery || selectedTag ? t("noMatchingConversations") || "No matches found" : t("noSavedConversations") || "No history yet"}
                    </div>
                )}
            </div>
        </div>
    );
}

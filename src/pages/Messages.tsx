import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useMessages } from '../hooks/use-messages';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import { Skeleton } from '../components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Send, ArrowLeft, MoreVertical, Edit, Trash2, UserX, UserPlus, UserMinus, Image as ImageIcon, Smile, X, Loader2, Search, ArrowRight, User, GrapeIcon, SmileIcon, SmilePlus } from 'lucide-react';
import { useTranslation } from '../hooks/use-translation';
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from '../hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { EmojiPicker } from '../components/ui-custom/EmojiPicker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomBar } from "@/components/layout/BottomBar";
import { ar } from "date-fns/locale";
import { compressFile } from '../utils/imageCompression';

const Messages = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { conversationId, userId } = useParams<{ conversationId: string; userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const {
    loading,
    conversations,
    currentConversation,
    messages,
    getConversations,
    getMessages,
    sendMessage,
    subscribeToMessages,
    createConversation,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    blockUser,
    unblockUser,
    blockedUsers,
    getBlockedUsers,
    deleteConversation,
  } = useMessages();
  
  

  const [messageContent, setMessageContent] = useState('');
  const [showConversations, setShowConversations] = useState(!conversationId || isMobile);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [giphySearch, setGiphySearch] = useState('');
  const [giphyResults, setGiphyResults] = useState<any[]>([]);
  const [showGiphyPicker, setShowGiphyPicker] = useState(false);
  const [loadingGiphy, setLoadingGiphy] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isRtl } = useTranslation();

  // Load conversations and blocked users on mount
  useEffect(() => {
    getConversations();
    getBlockedUsers();
    
    // If userId is provided (from profile page), create a conversation with that user
    const handleUserIdParam = async () => {
      if (userId && user && userId !== user.id) {
        try {
          const newConversationId = await createConversation(userId);
          if (newConversationId) {
            navigate(`/messages/${newConversationId}`, { replace: true });
          }
        } catch (error) {
          console.error('Failed to create conversation:', error);
          toast({
            title: 'Error',
            description: 'Failed to start conversation with this user',
            variant: 'destructive',
          });
        }
      }
    };
    
    if (userId) {
      handleUserIdParam();
    }
  }, [getConversations, userId, user, createConversation, navigate, toast]);

  // Load messages when conversation ID changes
  useEffect(() => {
    if (conversationId) {
      getMessages(conversationId);
      setShowConversations(false);
    } else {
      setShowConversations(true);
    }
  }, [conversationId, getMessages]);

  // Subscribe to new messages
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = subscribeToMessages(conversationId, () => {
      getMessages(conversationId);
    });

    return () => {
      unsubscribe();
    };
  }, [conversationId, subscribeToMessages, getMessages]);

 

  const handleEditMessage = async (messageId: string, content: string) => {
    if (!messageId || !content.trim()) return;
    try {
      await editMessage(messageId, content);
      setEditingMessageId(null);
      setEditContent('');
    } catch (error) {
      console.error('Error editing message:', error);
      toast({
        title: 'Error',
        description: 'Failed to edit message',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!messageId) return;
    try {
      await deleteMessage(messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive',
      });
    }
  };

  const handleAddReaction = async (messageId: string, reaction: string) => {
    if (!messageId || !reaction) return;
    try {
      const { data: existingReactions } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('message_id', messageId)
        .eq('user_id', user?.id);

      if (existingReactions && existingReactions.length >= 2) {
        // Replace the oldest reaction
        const oldestReaction = existingReactions[0];
        await supabase
          .from('message_reactions')
          .delete()
          .eq('id', oldestReaction.id);
      }

      await addReaction(messageId, reaction);
      setShowEmojiPicker(false);
      toast({
        title: 'Success',
        description: 'Reaction added!',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to add reaction',
        variant: 'destructive',
      });
    }
  };
  
  const searchGiphy = async (query: string) => {
    if (!query.trim()) return;
    
    setLoadingGiphy(true);
    try {
      const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=GlVGYHkr3WSBnllca54iNt0yFbjz7L65&q=${encodeURIComponent(query)}&limit=20`);
      const data = await response.json();
      setGiphyResults(data.data || []);
    } catch (error) {
      console.error('Error searching Giphy:', error);
      toast({
        title: 'Error',
        description: 'Failed to search GIFs',
        variant: 'destructive',
      });
    } finally {
      setLoadingGiphy(false);
    }
  };
  
  const handleGiphySelect = async (gifUrl: string) => {
    if (!conversationId) return;
    
    try {
      await sendMessage(conversationId, 'GIF', [gifUrl], 'gif');
      setShowGiphyPicker(false);
      setGiphySearch('');
      setGiphyResults([]);
    } catch (error) {
      console.error('Error sending GIF:', error);
      toast({
        title: 'Error',
        description: 'Failed to send GIF',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveReaction = async (messageId: string, reaction: string) => {
    if (!messageId || !reaction) return;
    try {
      await removeReaction(messageId, reaction);
    } catch (error) {
      console.error('Error removing reaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove reaction',
        variant: 'destructive',
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const validFiles = files.filter(file => 
        file.type.startsWith('image/') || file.type.startsWith('video/')
      );
      if (validFiles.length !== files.length) {
        toast({
          title: 'Warning',
          description: 'Some files were skipped. Only images and videos are supported.',
          variant: 'default',
        });
      }
      setSelectedFiles(validFiles);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  



const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationId || (!messageContent.trim() && selectedFiles.length === 0)) return;
    
    setUploading(true);
    try {
      if (selectedFiles.length > 0) {
        const mediaUrls: string[] = [];
        
        for (const file of selectedFiles) {
          // Compress image files before upload
          const processedFile = await compressFile(file);
          
          const fileExt = processedFile.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${conversationId}/${fileName}`;
          
          // Convert processed file to ArrayBuffer for direct upload
          const arrayBuffer = await processedFile.arrayBuffer();
          
          const { error: uploadError, data } = await supabase.storage
            .from('messages_media')
            .upload(filePath, arrayBuffer, {
              contentType: processedFile.type,  // Set the correct content type
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) throw uploadError;
          
          const { data: { publicUrl } } = supabase.storage
            .from('messages_media')
            .getPublicUrl(filePath);
          
          mediaUrls.push(publicUrl);
        }
        
        const mediaType = selectedFiles[0].type.startsWith('image/') ? 'image' : 'video';
        await sendMessage(conversationId, messageContent, mediaUrls, mediaType);
      } else {
        await sendMessage(conversationId, messageContent);
      }
      
      setMessageContent('');
      setSelectedFiles([]);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleConversationClick = (id: string) => {
    navigate(`/messages/${id}`);
    if (isMobile) {
      setShowConversations(false);
    }
  };

  const handleBackToConversations = () => {
    setShowConversations(true);
    navigate('/messages');
  };

  // Get other participant in conversation (for display purposes)
  const getOtherParticipant = () => {
    if (!currentConversation || !user) return null;
    return currentConversation.participants.find(p => p.user_id !== user.id);
  };

  const otherParticipant = getOtherParticipant();
  const isBlocked = blockedUsers.includes(otherParticipant?.user_id || '');
  const [amIBlocked, setAmIBlocked] = useState(false);

  // Check if current user is blocked
  useEffect(() => {
    const checkIfBlocked = async () => {
      if (!user || !otherParticipant) return;
      
      try {
        const { data, error } = await supabase
          .from('blocked_users')
          .select('blocker_id')
          .eq('blocker_id', otherParticipant.user_id)
          .eq('blocked_id', user.id)
          .maybeSingle();

        if (error) throw error;
        setAmIBlocked(!!data);
      } catch (error: any) {
        console.error('Error checking blocked status:', error);
      }
    };

    checkIfBlocked();
  }, [user, otherParticipant]);
  const [isFollowing, setIsFollowing] = useState(false);
  
  useEffect(() => {
    if (otherParticipant && user?.id) {
      const checkFollowingStatus = async () => {
        const { data } = await supabase
          .rpc('is_following', {
            follower_id: user.id,
            following_id: otherParticipant.user_id
          });
        setIsFollowing(data);
      };
      checkFollowingStatus();
    }
  }, [otherParticipant, user]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="container mx-auto pt-24 pb-16 max-w-6xl flex-1">
        <div className='flex gap-3'>
          <a href='/'>
            {isRtl? <ArrowRight className="h-5 w-5 mt-2" /> : <ArrowLeft className="h-5 w-5 mt-2" />}
          </a>
          <h1 className="text-2xl font-bold mb-6 flex">{t('Messages')}</h1>
        </div>
      <div className="flex rounded-lg border overflow-hidden h-[calc(100vh-200px)]">
        {/* Conversations List */}
        {(showConversations || !isMobile) && (
          <div className={`${isMobile ? 'w-full' : 'w-1/3'} border-r border-l`}>
            <div className="p-[26px] border-b border-l">
              <h2 className="font-semibold">{t('Conversations')}</h2>
            </div>
            <ScrollArea className="h-[calc(100vh-260px)]">
              {loading && !conversations.length ? (
                // Loading skeletons
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 border-b">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                ))
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {t('No conversations yet')}
                </div>
              ) : (
                conversations.map(conversation => {
                  const otherUser = conversation.participants.find(p => p.user_id !== user?.id);
                  if (!otherUser) return null;
                  
                  return (
                    <div 
                      key={conversation.id}
                      className={`flex items-center gap-3 p-4 border-b hover:bg-muted/50 cursor-pointer ${conversation.id === conversationId ? 'bg-muted' : ''}`}
                      onClick={() => handleConversationClick(conversation.id)}
                      dir={isRtl ? 'rtl' : 'ltr'}
                    >
                      <Avatar>
                        <AvatarImage src={otherUser.avatar_url} alt={otherUser.display_name} />
                        <AvatarFallback>{otherUser.display_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="font-medium truncate">{otherUser.display_name}</p>
                          {conversation.last_message && (
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(conversation.last_message.created_at), { 
                              addSuffix: true,
                              locale: isRtl ? ar : undefined
                            })}
                            </span>
                          )}
                        </div>
                        {conversation.last_message && (
                          <p className="text-sm text-muted-foreground truncate text-start">
                            {conversation.last_message.sender_id === user?.id ? `${t('You')}: ` : ''}
                            {conversation.last_message.content?.slice(0, 20)}{conversation.last_message.content?.length > 20 ? '...' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </ScrollArea>
          </div>
        )}

        {/* Messages Area */}
        {(!showConversations || !isMobile) && conversationId && (
          <div className={`${isMobile ? 'w-full' : 'w-2/3'} flex flex-col`}>
            {/* Conversation Header */}
            <div className="p-4 border-b flex items-center gap-3">
              {isMobile && (
                <Button variant="ghost" size="icon" onClick={() => {
                  if (location.state?.from) {
                    navigate(location.state.from);
                  } else {
                    handleBackToConversations();
                  }
                }}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              {otherParticipant && (
                <>
                  <Avatar className="cursor-pointer" onClick={() => navigate(`/profile/${otherParticipant.username}`)}>
                    <AvatarImage src={otherParticipant.avatar_url} alt={otherParticipant.display_name} />
                    <AvatarFallback>{otherParticipant.display_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium flex">
                      <a href={`/profile/${otherParticipant.username}`} className="hover:underline">
                        {otherParticipant.display_name}
                      </a>
                    </p>
                    <p className="text-sm text-muted-foreground flex">@{otherParticipant.username}</p>
                  </div>
                  {otherParticipant.user_id !== user?.id && (
                     <Button
                       variant={isFollowing ? "ghost" : "outline"}
                       size="sm"
                       className="mr-2"
                       onClick={async () => {
                         if (isFollowing) {
                           const { error } = await supabase
                              .from('followers')
                              .delete()
                              .eq('follower_id', user?.id)
                              .eq('following_id', otherParticipant.user_id);
                            if (!error) {
                              setIsFollowing(false);
                              toast({
                                title: isRtl ? "تم إلغاء المتابعة بنجاح" : "Successfully unfollowed",
                                variant: "default"
                              });
                            }
                         } else {
                           const { error } = await supabase
                             .from('followers')
                             .insert({
                               follower_id: user?.id,
                               following_id: otherParticipant.user_id
                             });
                           if (!error) {
                             setIsFollowing(true);
                             toast({
                               title: isRtl ? "تم المتابعة بنجاح" : "Successfully followed",
                               variant: "default"
                             });
                           }
                         }
                       }}
                     >
                       {isFollowing ? (
                         <>
                           <UserX className="h-4 w-4 mr-1" />
                           {t('Unfollow')}
                         </>
                       ) : (
                         <>
                           <UserPlus className="h-4 w-4 mr-1" />
                           {t('Follow')}
                         </>
                       )}
                     </Button>
                   )}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48">
                      <div className="space-y-2">
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => navigate(`/profile/${otherParticipant.username}`)}
                        >
                          <User className="h-4 w-4 mr-2" />
                          {t('view_profile')}
                        </Button>
                        
                        {blockedUsers.includes(otherParticipant.user_id) ? (
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => unblockUser(otherParticipant.user_id)}
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            {t('Unblock')}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-destructive"
                            onClick={() => blockUser(otherParticipant.user_id)}
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            {t('Block')}
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-destructive"
                          onClick={() => {
                            if (currentConversation?.id) {
                              deleteConversation(currentConversation.id);
                              handleBackToConversations();
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('Delete_Chat')}
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </>
              )}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" dir={isRtl? 'rtl' : 'ltr'} style={{ height: 'calc(100vh - 200px)' }}>
              {(isBlocked || amIBlocked) && (
                <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                  {isBlocked 
                     ? t('You_cannot_send_blocked')
                     : t('You_cannot_send_has_blocked_you')}
                </div>
              )}
              {loading && !messages.length ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'} mb-4`}>
                    <div className={`max-w-[70%] ${i % 2 === 0 ? 'bg-muted' : 'bg-primary text-primary-foreground'} rounded-lg p-3`}>
                      <Skeleton className="h-4 w-40" />
                    </div>
                  </div>
                ))
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-muted-foreground">
                  <div>
                    <p>{t('No_messages')}</p>
                    <p className="text-sm">{t('Send_message')}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pb-2">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      ref={message.id === messages[messages.length - 1].id ? messagesEndRef : undefined}
                      className={`flex flex-col ${message.sender_id === user?.id ? 'items-start' : 'items-end'} mb-4`}
                    >
                  <div
                    className={`max-w-[70%] ${message.sender_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'} ${isRtl? 'pl-5':'pr-5'} rounded-lg p-3 relative group`}
                  >
                    {message.sender_id === user?.id && (
                      <div className={`absolute opacity-0 group-hover:opacity-100 transition-opacity`}
                        style={{
                          right: isRtl? 'auto' : '10px',
                          left: isRtl? '10px' : 'auto',
                        }}
                      >
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-40 p-2">
                            <Button
                              variant="ghost"
                              className="w-full justify-start"
                              disabled={new Date().getTime() - new Date(message.created_at).getTime() > 60000}
                              onClick={() => {
                                setEditingMessageId(message.id);
                                setEditContent(message.content);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              {t('Edit')}
                            </Button>
                            <Button
                              variant="ghost"
                              className="w-full justify-start text-destructive"
                              onClick={() => handleDeleteMessage(message.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t('Delete')}
                            </Button>
                            {!isBlocked && !amIBlocked && (
                              <>
                                <Separator className="my-2" />
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-start">
                                      <Smile className="h-4 w-4 mr-2" />
                                      {t('React')}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-64 p-0" align="end">
                                    <ScrollArea className="h-[200px] p-4">
                                      <EmojiPicker onEmojiSelect={(emoji) => handleAddReaction(message.id, emoji)} />
                                    </ScrollArea>
                                  </PopoverContent>
                                </Popover>
                              </>
                            )}
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                    
                    {editingMessageId === message.id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleEditMessage(message.id, editContent);
                        }}
                        className="flex gap-2"
                      >
                        <Input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="flex-1 text-primary"
                        />
                        <Button type="submit" size="sm" variant="ghost">{t('Save')}</Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingMessageId(null);
                            setEditContent('');
                          }}
                        >
                          {t('Cancel')}
                        </Button>
                      </form>
                    ) : (
                      <>
                        <p className={`text-start`}>{message.content}</p>
                        {message.media_urls && message.media_urls.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {message.media_urls.map((url, index) => (
                              <div key={index}>
                                {message.media_type === 'image' || message.media_type === 'gif' ? (
                                  <img src={url} alt="" className="rounded-md max-w-full" />
                                ) : message.media_type === 'video' ? (
                                  <video src={url} controls className="rounded-md max-w-full" />
                                ) : null}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className={`flex items-center justify-between gap-2 text-xs mt-1 ${message.sender_id === user?.id ? 'flex-row' : 'flex-row-reverse'}`}>
                          <span className=' opacity-70'>
                            {formatDistanceToNow(new Date(message.created_at), { 
                              addSuffix: true,
                              locale: isRtl ? ar : undefined
                            })}
                            {message.edited && ` · ${t('edited')}`}
                          </span>
                          <div className={`flex gap-2 ${message.sender_id === user?.id ? 'flex-row' : 'flex-row-reverse'} `} >
                            <div className="flex items-center gap-1  opacity-70">
                              
                              {!isBlocked && !amIBlocked && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                      <SmilePlus className="h-4 w-4" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80 p-0">
                                    <ScrollArea className="h-[225px] p-2">
                                      <EmojiPicker
                                        onEmojiSelect={(emoji) => {
                                          handleAddReaction(message.id, emoji);
                                        }}
                                      />
                                    </ScrollArea>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                            {message.reactions && message.reactions.length > 0 && !isBlocked && !amIBlocked && (
                              <AnimatePresence>
                                <motion.div 
                                  initial={{ y: 10, opacity: 0 }}
                                  animate={{ y: 0, opacity: 1 }}
                                  exit={{ y: 10, opacity: 0 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                  dir={isRtl? 'rtl' : 'ltr'}
                                  className={`
                                    flex gap-1 px-2 py-1 rounded-full shadow-lg bg-background border
                                    ${message.sender_id === user?.id ? (isRtl ? '-ml-16 mr-0' : '-mr-16 mr-0') : (isRtl ? '-mr-12 ml-0' : '-ml-12 mr-0')}
                                  `}
                                >
                                  {message.reactions.slice(0, 2).map((reaction, index) => (
                                    <motion.button
                                      key={`${reaction.id}-${index}`}
                                      whileHover={{ scale: 1.2 }}
                                      whileTap={{ scale: 0.9 }}
                                      transition={{ type: "spring", stiffness: 400 }}
                                      className="text-sm hover:bg-muted/50 rounded-full w-6 h-6 flex items-center justify-center text-foreground hover:text-foreground"
                                      onClick={() => handleRemoveReaction(message.id, reaction.reaction)}
                                      title="Click to remove reaction"
                                    >
                                      {reaction.reaction}
                                    </motion.button>
                                  ))}
                                </motion.div>
                              </AnimatePresence>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Action Buttons */}
            {!isFollowing && otherParticipant && otherParticipant.user_id !== user?.id && (
              <div className="flex justify-center gap-2 p-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const { error } = await supabase
                      .from('followers')
                      .insert({
                        follower_id: user?.id,
                        following_id: otherParticipant.user_id
                      });
                    if (!error) {
                      setIsFollowing(true);
                      toast({
                        title: t('Successfully followed'),
                        variant: "default"
                      });
                    } else {
                      toast({
                        title: t('Failed to follow user'),
                        description: error.message,
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  {t('Follow')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      if (isBlocked) {
                        await unblockUser(otherParticipant.user_id);
                        toast({
                          title: t('User unblocked successfully'),
                          variant: "default"
                        });
                      } else {
                        await blockUser(otherParticipant.user_id);
                        toast({
                          title: t('User blocked successfully'),
                          variant: "default"
                        });
                      }
                    } catch (error: any) {
                      toast({
                        title: t('Failed to update block status'),
                        description: error.message,
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <UserX className="h-4 w-4 mr-1" />
                  {isBlocked ? t('Unblock') : t('Block')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const { error } = await supabase
                      .from('reports')
                      .insert({
                        reporter_id: user?.id,
                        reported_id: otherParticipant.user_id,
                        content_type: 'user',
                        content_id: otherParticipant.user_id,
                        reason: 'inappropriate_behavior'
                      });
                    if (!error) {
                      toast({
                        title: t('User reported successfully'),
                        variant: "default"
                      });
                    } else {
                      toast({
                        title: t('Failed to report user'),
                        description: error.message,
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <ArrowRight className="h-4 w-4 mr-1" />
                  {t('Report')}
                </Button>
              </div>
            )}

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex flex-col gap-2">
                {selectedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative">
                        {file.type.startsWith('image/') ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt=""
                            className="h-20 w-20 object-cover rounded-md"
                          />
                        ) : (
                          <video
                            src={URL.createObjectURL(file)}
                            className="h-20 w-20 object-cover rounded-md"
                          />
                        )}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  {!isBlocked && !amIBlocked && (
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowGiphyPicker(true)}
                    >
                      <SmileIcon className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Input
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder={isBlocked || amIBlocked ? t('You_cannot_send') : t('Type_a_message')}
                    disabled={isBlocked || amIBlocked}
                  />
                  <Button type="submit" disabled={uploading}>
                    {uploading ? (
                      <div className="animate-spin">
                        <Loader2 className="h-4 w-4" />
                      </div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
      
      {/* Giphy Picker Dialog */}
      <Dialog open={showGiphyPicker} onOpenChange={setShowGiphyPicker}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Select a GIF')}</DialogTitle>
            <DialogDescription>
              {t('Search and select a GIF to send in your message.')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                placeholder={t('Search GIFs...')}
                value={giphySearch}
                onChange={(e) => setGiphySearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchGiphy(giphySearch)}
              />
              <Button onClick={() => searchGiphy(giphySearch)}>
                <Search className="h-4 w-4 mr-2" />
                {t('Search')}
              </Button>
            </div>
            <ScrollArea className="h-[300px]">
              {loadingGiphy ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : giphyResults.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {giphyResults.map((gif) => (
                    <motion.img
                      key={gif.id}
                      src={gif.images.fixed_height_small.url}
                      alt="GIF"
                      className="rounded cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleGiphySelect(gif.images.original.url)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  {giphySearch ? t('No results found') : t('Search for GIFs')}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
      </div>
      <Footer />
      <BottomBar />
    </div>
  );
};

export default Messages;
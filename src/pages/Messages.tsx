import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMessages } from '../hooks/use-messages';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import { Skeleton } from '../components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Send, ArrowLeft } from 'lucide-react';
import { useTranslation } from '../hooks/use-translation';
import { useIsMobile } from '../hooks/use-mobile';

const Messages = () => {
  const { t } = useTranslation();
  const { isMobile } = useIsMobile();
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
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
  } = useMessages();

  const [messageContent, setMessageContent] = useState('');
  const [showConversations, setShowConversations] = useState(!conversationId || isMobile);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    getConversations();
  }, [getConversations]);

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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationId || !messageContent.trim()) return;

    await sendMessage(conversationId, messageContent);
    setMessageContent('');
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

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">{t('Messages')}</h1>
      
      <div className="flex rounded-lg border overflow-hidden h-[calc(100vh-200px)]">
        {/* Conversations List */}
        {(showConversations || !isMobile) && (
          <div className={`${isMobile ? 'w-full' : 'w-1/3'} border-r`}>
            <div className="p-4 border-b">
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
                              {formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        {conversation.last_message && (
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.last_message.sender_id === user?.id ? `${t('You')}: ` : ''}
                            {conversation.last_message.content}
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
                <Button variant="ghost" size="icon" onClick={handleBackToConversations}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              {otherParticipant && (
                <>
                  <Avatar>
                    <AvatarImage src={otherParticipant.avatar_url} alt={otherParticipant.display_name} />
                    <AvatarFallback>{otherParticipant.display_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{otherParticipant.display_name}</p>
                    <p className="text-sm text-muted-foreground">@{otherParticipant.username}</p>
                  </div>
                </>
              )}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {loading && !messages.length ? (
                // Loading skeletons for messages
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
                    <p>{t('No messages yet')}</p>
                    <p className="text-sm">{t('Send a message to start the conversation')}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map(message => {
                    const isCurrentUser = message.sender_id === user?.id;
                    return (
                      <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        {!isCurrentUser && (
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src={message.sender?.avatar_url} alt={message.sender?.display_name} />
                            <AvatarFallback>{message.sender?.display_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div 
                          className={`max-w-[70%] rounded-lg p-3 ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                        >
                          <p>{message.content}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t mt-auto">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder={t('Type a message...')}
                  className="flex-1"
                />
                <Button type="submit" disabled={!messageContent.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  {t('Send')}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
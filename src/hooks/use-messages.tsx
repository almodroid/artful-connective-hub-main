import { useCallback, useState } from 'react';
import { useToast } from './use-toast';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';


type MessageReaction = {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
  created_at: string;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  updated_at: string;
  media_urls?: string[];
  media_type?: 'image' | 'video' | 'gif';
  edited?: boolean;
  edited_at?: string;
  reactions?: MessageReaction[];
  sender?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
};

type Conversation = {
  id: string;
  created_at: string;
  updated_at: string;
  participants: {
    user_id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  }[];
  last_message?: Message;
};

export const useMessages = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

  // Get all conversations for the current user
  const getConversations = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get all conversations where the current user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (participantError) throw participantError;
      
      if (!participantData || participantData.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const conversationIds = participantData.map(p => p.conversation_id);
      
      // Get conversation details
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      // For each conversation, get participants and last message
      const conversationsWithDetails = await Promise.all(conversationsData.map(async (conv) => {
        // Get participants
        const { data: participantsData, error: participantsError } = await supabase
          .from('conversation_participants')
          .select(`
            user_id,
            profiles:user_id(username, display_name, avatar_url)
          `)
          .eq('conversation_id', conv.id);

        if (participantsError) throw participantsError;

        // Get last message
        const { data: lastMessageData, error: lastMessageError } = await supabase
          .from('messages')
          .select(`
            *,
            sender:sender_id(username, display_name, avatar_url)
          `)
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (lastMessageError) throw lastMessageError;

        // Format participants data
        const participants = participantsData.map(p => ({
          user_id: p.user_id,
          username: p.profiles.username,
          display_name: p.profiles.display_name,
          avatar_url: p.profiles.avatar_url
        }));

        return {
          ...conv,
          participants,
          last_message: lastMessageData && lastMessageData.length > 0 ? lastMessageData[0] : undefined
        };
      }));

      setConversations(conversationsWithDetails);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load conversations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Get messages for a specific conversation
  const getMessages = useCallback(async (conversationId: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get conversation details first
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (conversationError) throw conversationError;

      // Get participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('conversation_participants')
        .select(`
          user_id,
          profiles:user_id(username, display_name, avatar_url)
        `)
        .eq('conversation_id', conversationId);

      if (participantsError) throw participantsError;

      // Format participants data
      const participants = participantsData.map(p => ({
        user_id: p.user_id,
        username: p.profiles.username,
        display_name: p.profiles.display_name,
        avatar_url: p.profiles.avatar_url
      }));

      // Set current conversation
      setCurrentConversation({
        ...conversationData,
        participants
      });

      // Get messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(username, display_name, avatar_url),
          reactions:message_reactions(*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      setMessages(messagesData || []);

      // Mark unread messages as read
      if (messagesData && messagesData.length > 0) {
        const unreadMessages = messagesData
          .filter(msg => !msg.read && msg.sender_id !== user.id)
          .map(msg => msg.id);

        if (unreadMessages.length > 0) {
          await supabase
            .from('messages')
            .update({ read: true })
            .in('id', unreadMessages);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load messages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Create a new conversation with another user
  const createConversation = useCallback(async (otherUserId: string) => {
    if (!user) return null;
    if (user.id === otherUserId) {
      toast({
        title: 'Error',
        description: 'You cannot start a conversation with yourself',
        variant: 'destructive',
      });
      return null;
    }
    
    setLoading(true);
    try {
      // Check if conversation already exists
      const { data: existingConvData, error: existingConvError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (existingConvError) throw existingConvError;

      if (existingConvData && existingConvData.length > 0) {
        const conversationIds = existingConvData.map(c => c.conversation_id);
        
        const { data: otherParticipantData, error: otherParticipantError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', otherUserId)
          .in('conversation_id', conversationIds);

        if (otherParticipantError) throw otherParticipantError;

        // If there's a match, a conversation already exists between these users
        if (otherParticipantData && otherParticipantData.length > 0) {
          // Get the first matching conversation
          const existingConversationId = otherParticipantData[0].conversation_id;
          await getMessages(existingConversationId);
          return existingConversationId;
        }
      }

      // Create new conversation
      const { data: newConversation, error: newConversationError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();

      if (newConversationError) throw newConversationError;

      // Add participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConversation.id, user_id: user.id },
          { conversation_id: newConversation.id, user_id: otherUserId }
        ]);

      if (participantsError) throw participantsError;

      // Refresh conversations list and return the new conversation ID
      await getConversations();
      await getMessages(newConversation.id);
      return newConversation.id;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create conversation',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast, getConversations, getMessages]);

  // Get blocked users
  const getBlockedUsers = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', user.id);

      if (error) throw error;
      setBlockedUsers(data.map(item => item.blocked_id));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to get blocked users',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  // Block a user
  const blockUser = useCallback(async (userId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: user.id,
          blocked_id: userId
        });

      if (error) throw error;
      await getBlockedUsers();
      toast({
        title: 'Success',
        description: 'User blocked successfully',
        variant: 'default'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to block user',
        variant: 'destructive',
      });
    }
  }, [user, toast, getBlockedUsers]);

  // Unblock a user
  const unblockUser = useCallback(async (userId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId);

      if (error) throw error;
      await getBlockedUsers();
      toast({
        title: 'Success',
        description: 'User unblocked successfully',
        variant: 'default'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unblock user',
        variant: 'destructive',
      });
    }
  }, [user, toast, getBlockedUsers]);

  // Toggle reaction on a message
  const addReaction = useCallback(async (messageId: string, reaction: string) => {
    if (!user) return;
    
    try {
      const { data: existingReaction } = await supabase
        .from('message_reactions')
        .select()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('reaction', reaction)
        .maybeSingle();

      if (existingReaction) {
        // Remove existing reaction
        const { error: removeError } = await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (removeError) throw removeError;
      } else {
        // Add new reaction
        const { error: addError } = await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            reaction
          });

        if (addError) throw addError;
      }

      await getMessages(currentConversation?.id || '');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to toggle reaction',
        variant: 'destructive',
      });
    }
  }, [user, toast, getMessages, currentConversation]);

  // Remove reaction from a message
  const removeReaction = useCallback(async (messageId: string, reaction: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('reaction', reaction);

      if (error) throw error;
      await getMessages(currentConversation?.id || '');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove reaction',
        variant: 'destructive',
      });
    }
  }, [user, toast, getMessages, currentConversation]);

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .rpc('delete_conversation', { conversation_id_param: conversationId });

      if (error) throw error;
      await getConversations();
      toast({
        title: 'Success',
        description: 'Conversation deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete conversation',
        variant: 'destructive',
      });
    }
  }, [user, toast, getConversations]);

  // Send a message in the current conversation
  const sendMessage = useCallback(async (conversationId: string, content: string, mediaUrls?: string[], mediaType?: 'image' | 'video' | 'gif') => {
    if (!user || (!content.trim() && (!mediaUrls || mediaUrls.length === 0))) return null;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
          media_urls: mediaUrls,
          media_type: mediaType
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh messages
      await getMessages(conversationId);
      return data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast, getMessages]);

  // Edit a message
  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({ content: newContent.trim() })
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) {
        if (error.message.includes('Cannot edit message after 60 seconds')) {
          toast({
            title: 'Error',
            description: 'Messages can only be edited within 60 seconds of sending',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return;
      }

      await getMessages(currentConversation?.id || '');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to edit message',
        variant: 'destructive',
      });
    }
  }, [user, toast, getMessages, currentConversation]);

  // Delete a message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) throw error;
      await getMessages(currentConversation?.id || '');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete message',
        variant: 'destructive',
      });
    }
  }, [user, toast, getMessages, currentConversation]);

  // Set up real-time subscription for new messages
  const subscribeToMessages = useCallback((conversationId: string, callback: () => void) => {
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, callback)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return {
    loading,
    conversations,
    currentConversation,
    messages,
    getConversations,
    getMessages,
    createConversation,
    sendMessage,
    subscribeToMessages,
    blockUser,
    unblockUser,
    blockedUsers,
    getBlockedUsers,
    addReaction,
    removeReaction,
    editMessage,
    deleteMessage,
    deleteConversation,
  };
};
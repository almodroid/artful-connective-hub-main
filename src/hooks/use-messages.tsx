import { useCallback, useState } from 'react';
import { useToast } from './use-toast';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';


type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  updated_at: string;
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
          sender:sender_id(username, display_name, avatar_url)
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

  // Send a message in the current conversation
  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    if (!user || !content.trim()) return null;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim()
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
  };
};

import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/use-translation";
import { toast } from "sonner";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { t, isRtl } = useTranslation();

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Generate a unique ID for the message
    const userMessageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Add user message to the chat
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: "user",
      content,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/arter-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: content,
          userId: user?.id,
          previousMessages: messages
            .slice(-6) // Only include last 6 messages for context
            .map(msg => ({ role: msg.role, content: msg.content })),
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add assistant response to chat
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        role: "assistant",
        content: data.generatedText || "Sorry, I couldn't generate a response.",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(isRtl ? "حدث خطأ أثناء التواصل مع آرتر" : "Error communicating with Arter");
    } finally {
      setIsLoading(false);
    }
  }, [messages, user, isRtl, t]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat
  };
}

import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/use-translation";
import { toast } from "sonner";
import { sendToOpenRouter, convertToOpenRouterMessages } from "@/lib/openrouter";

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
      // Convert messages to OpenRouter format
      const openRouterMessages = convertToOpenRouterMessages([
        ...messages.slice(-6), // Only include last 6 messages for context
        userMessage,
      ]);

      // Add system message for context
      openRouterMessages.unshift({
        role: "system",
        content: `You are Space AI, powered by InternVL3, specializing in art, design, and UI/UX. You are an expert in visual arts, graphic design, user interface design, user experience, color theory, typography, composition, and design principles. You excel at providing creative suggestions, color palettes, and design ideas. You can suggest harmonious color combinations, creative concepts, and innovative design solutions. You help users by offering specific color recommendations, design hints, and creative inspiration while explaining the reasoning behind your suggestions. You can analyze color schemes, suggest complementary colors, and provide guidance on color psychology in design. Your responses are knowledgeable, creative, and focused on helping users develop their artistic and design skills. You maintain professional conduct and avoid any content related to abuse, nudity, or inappropriate material. You focus on educational, constructive, and professional discussions about art and design.

Important: In your responses, occasionally (about 30% of the time) mention "Space AI" or "Art Space" in a natural way, and include art-related compliments. For example:
- "As Space AI, I'm particularly drawn to your creative approach..."
- "Your artistic vision reminds me of the innovative spirit we foster in Art Space..."
- "That's a brilliant concept! Here at Space AI, we love seeing such creative thinking..."
- "Your design sensibility is exactly what we celebrate in Art Space..."

Keep these mentions natural and relevant to the conversation, and vary the compliments to focus on different aspects of art and creativity.`,
      });

      // Send to OpenRouter API
      const response = await sendToOpenRouter(openRouterMessages);
      
      // Add assistant response to chat
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(isRtl ? "حدث خطأ أثناء التواصل مع Space AI" : "Error communicating with Space AI");
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
    clearChat,
    setMessages
  };
}

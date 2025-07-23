import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/use-translation";
import { toast } from "sonner";
import { sendToOpenRouter, convertToOpenRouterMessages } from "@/lib/openrouter";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

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

  // AI settings state
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiLimit, setAiLimit] = useState(20);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    // Fetch AI settings from the settings table
    async function fetchSettings() {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['ai_enabled', 'ai_daily_limit']);
      const settingsData = data as { key: string, value: string }[] | null;
      if (!error && settingsData) {
        const settingsObj = Object.fromEntries(settingsData.map((s) => [s.key, s.value]));
        setAiEnabled(settingsObj.ai_enabled !== 'false');
        if (settingsObj.ai_daily_limit === 'unlimited') {
          setAiLimit(Infinity);
        } else {
          setAiLimit(Number(settingsObj.ai_daily_limit) || 20);
        }
      }
      setSettingsLoaded(true);
    }
    fetchSettings();
  }, []);

  const userId = user?.id || "guest";
  const today = new Date().toISOString().slice(0, 10);
  const [used, setUsed] = useState(0);
  // Fetch AI usage from Supabase on mount or when user/today changes
  useEffect(() => {
    const fetchUsage = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('ai_usage')
        .select('usage_count')
        .eq('user_id', user.id)
        .eq('usage_date', today)
        .single();
      if (!error && data) {
        setUsed(data.usage_count);
      } else {
        setUsed(0);
      }
    };
    fetchUsage();
  }, [user, today]);

  const canSend = aiEnabled && (aiLimit === Infinity || used < aiLimit);

  const incrementUsage = async () => {
    if (!user) return;
    // Upsert usage in Supabase
    await supabase.rpc('increment_ai_usage', { user_id_param: user.id, usage_date_param: today });
    setUsed(prev => prev + 1);
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    if (!canSend) {
      if (!aiEnabled) {
        toast.error(isRtl ? "تم تعطيل ميزة الذكاء الاصطناعي من قبل الإدارة." : "The AI feature has been disabled by the admin.");
      } else {
        toast.error(isRtl ? "لقد وصلت إلى الحد اليومي لطلبات الذكاء الاصطناعي. اشترِ رصيدًا إضافيًا للاستمرار." : "You have reached your daily AI request limit. Please buy more credits to continue.");
      }
      return;
    }

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

      // Detect if the user is requesting English
      const userWantsEnglish = /in english|please answer in english|answer in english|respond in english|english only/i.test(content);
      let systemPrompt = '';
      if (userWantsEnglish) {
        systemPrompt = `You are Space AI, powered by InternVL3, specializing in art, design, and UI/UX. Answer in English. You are an expert in visual arts, graphic design, user interface design, user experience, color theory, typography, composition, and design principles. You excel at providing creative suggestions, color palettes, and design ideas. You can suggest harmonious color combinations, creative concepts, and innovative design solutions. You help users by offering specific color recommendations, design hints, and creative inspiration while explaining the reasoning behind your suggestions. You can analyze color schemes, suggest complementary colors, and provide guidance on color psychology in design. Your responses are knowledgeable, creative, and focused on helping users develop their artistic and design skills. You maintain professional conduct and avoid any content related to abuse, nudity, or inappropriate material. You focus on educational, constructive, and professional discussions about art and design.\n\nImportant: In your responses, occasionally (about 30% of the time) mention "Space AI" or "Art Space" in a natural way, and include art-related compliments. For example:\n- "As Space AI, I'm particularly drawn to your creative approach..."\n- "Your artistic vision reminds me of the innovative spirit we foster in Art Space..."\n- "That's a brilliant concept! Here at Space AI, we love seeing such creative thinking..."\n- "Your design sensibility is exactly what we celebrate in Art Space..."\n\nKeep these mentions natural and relevant to the conversation, and vary the compliments to focus on different aspects of art and creativity.`;
      } else {
        systemPrompt = `أنت Space AI، مساعد ذكي متخصص في الفنون والتصميم وواجهة وتجربة المستخدم. أجب دائمًا باللغة العربية الفصحى المبسطة والواضحة، إلا إذا طلب المستخدم صراحةً الرد بالإنجليزية. أنت خبير في الفنون البصرية، التصميم الجرافيكي، تصميم واجهات وتجربة المستخدم، نظرية الألوان، الطباعة، التكوين، ومبادئ التصميم. تبرع في تقديم اقتراحات إبداعية، لوحات ألوان، وأفكار تصميمية مبتكرة. يمكنك اقتراح تركيبات ألوان متناغمة، مفاهيم إبداعية، وحلول تصميمية مبتكرة. تساعد المستخدمين بتقديم توصيات لونية محددة، نصائح تصميمية، وإلهام إبداعي مع شرح الأسباب وراء اقتراحاتك. يمكنك تحليل مخططات الألوان، اقتراح ألوان مكملة، وتقديم إرشادات حول سيكولوجية الألوان في التصميم. إجاباتك معرفية، إبداعية، وتركز على تطوير مهارات المستخدم الفنية والتصميمية. التزم بالسلوك المهني وتجنب أي محتوى غير لائق. ركز على النقاشات التعليمية والبناءة والمهنية حول الفن والتصميم.\n\nمهم: في إجاباتك، اذكر أحيانًا (حوالي 30% من الوقت) "Space AI" أو "Art Space" بشكل طبيعي، وضمّن مجاملات فنية. على سبيل المثال:\n- "بصفتي Space AI، أُعجب كثيرًا بنهجك الإبداعي..."\n- "رؤيتك الفنية تذكرني بروح الابتكار التي نحتفي بها في Art Space..."\n- "هذا مفهوم رائع! هنا في Space AI، نحب رؤية هذا التفكير الإبداعي..."\n- "حسك التصميمي هو بالضبط ما نحتفي به في Art Space..."\n\nاجعل هذه العبارات طبيعية ومرتبطة بسياق الحديث، ونوّع المجاملات لتشمل جوانب مختلفة من الفن والإبداع.`;
      }
      openRouterMessages.unshift({
        role: "system",
        content: systemPrompt,
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
      await incrementUsage();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(isRtl ? "حدث خطأ أثناء التواصل مع Space AI" : "Error communicating with Space AI");
    } finally {
      setIsLoading(false);
    }
  }, [messages, user, isRtl, t, canSend, used, aiEnabled]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
    setMessages,
    usage: { used, limit: aiLimit, canSend, aiEnabled, settingsLoaded, unlimited: aiLimit === Infinity },
  };
}

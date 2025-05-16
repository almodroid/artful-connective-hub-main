
import { useRef, useEffect } from "react";
import { ChatMessage } from "@/hooks/use-chat";
import { Palette, Brush, Wand, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

interface ChatContainerProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
}

export function ChatContainer({ messages, isLoading, onSendMessage }: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-8 text-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{t("meetArter")}</h2>
            <p className="text-muted-foreground max-w-md">
              {t("arterDescription")}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                className="justify-start text-left"
                onClick={() => onSendMessage(suggestion.text)}
                disabled={isLoading}
              >
                {suggestion.icon}
                <span className="truncate">{suggestion.text}</span>
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <>
        </>
      )}
    </div>
  );
}

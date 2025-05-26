import { useChat } from "@/hooks/use-chat";
import { Layout } from "@/components/layout/Layout";
import { ChatContainer } from "@/components/ui-custom/ChatContainer";
import { ChatInput } from "@/components/ui-custom/ChatInput";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { Trash2 } from "lucide-react";
import { Logo } from "@/components/layout/header/Logo";

const SpaceAIPage = () => {
  const { messages, isLoading, sendMessage, clearChat } = useChat();
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="max-w-3xl mx-auto h-[calc(100vh-16rem)] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex text-center align-center items-center">
            <Logo /><h1 className="text-2xl font-bold">Space AI</h1>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-muted-foreground"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("clearChat")}
            </Button>
          )}
        </div>
        
        <div className="flex-1 border rounded-lg overflow-hidden flex flex-col bg-background">
          <ChatContainer 
            messages={messages} 
            isLoading={isLoading} 
            onSendMessage={sendMessage}
            onClearChat={clearChat}
          />
          <div className="p-4 border-t">
            <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SpaceAIPage;

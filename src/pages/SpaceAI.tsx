import { useChat } from "@/hooks/use-chat";
import { Layout } from "@/components/layout/Layout";
import { ChatContainer } from "@/components/ui-custom/ChatContainer";
import { ChatInput } from "@/components/ui-custom/ChatInput";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { Trash2 } from "lucide-react";
import { Logo } from "@/components/layout/header/Logo";
import React, { PropsWithChildren } from "react";
import { Gift } from "lucide-react";

class SpaceAIErrorBoundary extends React.Component<PropsWithChildren<{}>> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error(error, info); }
  render() {
    if (this.state.hasError) {
      return <div style={{ padding: 32, textAlign: "center" }}>An error occurred in Space AI. Please refresh the page.</div>;
    }
    return this.props.children;
  }
}

const SpaceAIPage = () => {
  const { messages, isLoading, sendMessage, clearChat, setMessages, usage } = useChat();
  const { t } = useTranslation();

  return (
    <SpaceAIErrorBoundary>
    <Layout>
      <div className="max-w-3xl mx-auto h-[calc(100vh-16rem)] flex flex-col">
          {/* AI settings loading and disabled state */}
          {!usage.settingsLoaded ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4" />
              <span className="text-muted-foreground text-lg">{t('loading') || 'Loading...'}</span>
            </div>
          ) : !usage.aiEnabled ? (
            <div className="flex flex-col items-center justify-center py-16">
              <span className="text-destructive text-xl font-bold mb-2">{t('aiDisabledByAdmin') || 'Space AI is currently disabled by the admin.'}</span>
              <span className="text-muted-foreground">{t('aiDisabledByAdminDesc') || 'Please check back later or contact support.'}</span>
            </div>
          ) : (
            <>
              {/* Usage Progress Bar or Unlimited */}
              {usage.unlimited ? (
                <div className="w-full mb-4 flex items-center gap-2 text-green-600 font-semibold">
                  <Gift className="h-5 w-5 text-green-600" />
                  <span>{t('unlimitedAIRequests') || 'Unlimited AI Requests'}</span>
                </div>
              ) : (
                <div className="w-full mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {t('aiUsage')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {usage.used} / {usage.limit} {t('requests')}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5 mb-2">
                    <div
                      className="bg-primary h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${(usage.used / usage.limit) * 100}%` }}
                    />
                  </div>
                  {!usage.canSend && (
                    <div className="flex items-center gap-2 mt-2 text-destructive text-sm">
                      <span>{t('aiLimitReached')}</span>
                      <a href="/buy-credits" className="ml-2 px-3 py-1 rounded bg-primary text-white hover:bg-primary/80 transition">{t('buyCredits')}</a>
                    </div>
                  )}
                </div>
              )}
        <div className="flex items-center justify-between mb-4">
          <div className="hidden sm:flex text-center align-center items-center">
                  <Logo className="w-30 h-20 mb-4" />
                  <span className="font-display text-2xl font-bold mx-4">
                    {t('meetSpaceAI') || 'Meet Space AI, your smart assistant for art and design'}
                  </span>
          </div>
                <Button variant="ghost" onClick={clearChat} className="ml-auto">
                  {t('clearChat') || 'Clear chat'}
            </Button>
        </div>
          <ChatContainer 
            messages={messages} 
            isLoading={isLoading} 
            onSendMessage={sendMessage}
            onClearChat={clearChat}
            onLoadMessages={setMessages}
          />
          <div className="p-4 border-t">
                <ChatInput onSendMessage={usage.canSend ? sendMessage : () => {}} isLoading={isLoading} />
          </div>
            </>
          )}
      </div>
    </Layout>
    </SpaceAIErrorBoundary>
  );
};

export default SpaceAIPage;

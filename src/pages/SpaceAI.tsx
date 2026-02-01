import { useChat } from "@/hooks/use-chat";
import { Layout } from "@/components/layout/Layout";
import { ChatContainer } from "@/components/ui-custom/ChatContainer";
import { ChatInput } from "@/components/ui-custom/ChatInput";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { Logo } from "@/components/layout/header/Logo";
import React, { PropsWithChildren, useState } from "react";
import { Gift } from "lucide-react";
import { ChatHistorySidebar } from "@/components/ui-custom/ChatHistorySidebar";
import { cn } from "@/lib/utils";

class SpaceAIErrorBoundary extends React.Component<PropsWithChildren<{}>> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, info: any) { console.error(error, info); }
  render() {
    if (this.state.hasError) {
      return <div style={{ padding: 32, textAlign: "center" }}>An error occurred in Space AI. Please refresh the page.</div>;
    }
    return this.props.children;
  }
}

const SpaceAIPage = () => {
  const { messages, isLoading, sendMessage, clearChat, setMessages, usage } = useChat();
  const { t, isRtl } = useTranslation();
  const [historyKey, setHistoryKey] = useState(0);

  return (
    <SpaceAIErrorBoundary>
      <Layout hideSidebars>
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
          {/* History Sidebar - Order 1 */}
          <ChatHistorySidebar
            key={historyKey}
            onLoadConversation={setMessages}
            onNewChat={clearChat}
            className="hidden md:flex shrink-0"
          />

          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            <div className="flex-1 overflow-y-auto custom-scrollbar pt-8 pb-40">
              <div className="max-w-4xl mx-auto px-4 w-full">
                {/* AI settings loading or disabled states */}
                {!usage.settingsLoaded ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
                    <span className="text-muted-foreground text-lg italic">{t('loading') || 'Loading...'}</span>
                  </div>
                ) : !usage.aiEnabled ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="bg-purple-500/10 p-6 rounded-full mb-6">
                      <Logo className="w-20 h-20 opacity-50 grayscale brightness-125" link={false} />
                    </div>
                    <h2 className="text-purple-600 dark:text-purple-400 text-2xl font-bold mb-3">{t('aiDisabledByAdmin') || 'Space AI is Offline'}</h2>
                    <p className="text-purple-900/60 dark:text-purple-100/60 max-w-md">{t('aiDisabledByAdminDesc') || 'Please check back later or contact support for more information.'}</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Header Logo & Title */}
                    <div className="flex flex-col items-center text-center animate-fade-in">
                      <Logo className="w-32 h-20 mb-4 hover:scale-105 transition-transform duration-300" link={false} />
                      <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground tracking-tight px-4 max-w-2xl">
                        {t('meetSpaceAI') || 'Meet Space AI, your smart assistant for art and design'}
                      </h1>
                      {messages.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearChat}
                          className="mt-4 text-purple-600/70 dark:text-purple-400/70 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                        >
                          {t('clearChat') || 'Start New Chat'}
                        </Button>
                      )}
                    </div>

                    {/* Chat Area */}
                    <div className="min-h-[400px]">
                      <ChatContainer
                        messages={messages}
                        isLoading={isLoading}
                        onSendMessage={sendMessage}
                        onClearChat={clearChat}
                        onLoadMessages={setMessages}
                        onSaveConversation={() => setHistoryKey(prev => prev + 1)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Input Area at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 z-50">
              <div className="bg-gradient-to-t from-background via-background/95 to-transparent pt-10 pb-6 px-4">
                <div className="max-w-3xl mx-auto space-y-4">
                  {!usage.unlimited ? (
                    <div className="bg-purple-500/5 dark:bg-purple-950/20 backdrop-blur-md p-3 rounded-xl border border-purple-200/50 dark:border-purple-800/30 shadow-sm">
                      <div className="flex items-center justify-between text-xs mb-2 px-1">
                        <span className="text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse outline outline-4 outline-purple-500/20" />
                          {usage.used} / {usage.limit} {t('requests')}
                        </span>
                        {usage.used >= usage.limit && (
                          <a href="/buy-credits" className="text-purple-600 font-bold hover:underline">
                            {t('upgradeNeeded') || 'Get More Requests'}
                          </a>
                        )}
                      </div>
                      <div className="w-full bg-purple-100 dark:bg-purple-900/40 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-700 ease-out rounded-full",
                            (usage.used / usage.limit) > 0.8 ? "bg-purple-600 shadow-[0_0_8px_rgba(147,51,234,0.5)]" : "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                          )}
                          style={{ width: `${Math.min((usage.used / usage.limit) * 100, 100)}%` }}
                        />
                      </div>
                      {!usage.canSend && (
                        <div className="flex items-center justify-center gap-2 mt-2 text-purple-600 dark:text-purple-400 text-xs font-bold animate-bounce">
                          <span>{t('aiLimitReached')}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-600 rounded-full text-xs font-bold shadow-sm">
                        <Gift className="h-3.5 w-3.5" />
                        <span>{t('unlimitedAIRequests') || 'Unlimited Creative Access'}</span>
                      </div>
                    </div>
                  )}
                  <div className="shadow-2xl rounded-2xl overflow-hidden ring-1 ring-purple-500/20 border-2 border-purple-500/10">
                    <ChatInput
                      onSendMessage={usage.canSend ? sendMessage : () => { }}
                      isLoading={isLoading}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </SpaceAIErrorBoundary>
  );
};

export default SpaceAIPage;

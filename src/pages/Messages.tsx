import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/use-translation";
import { ConversationList } from "@/components/messages/ConversationList";
import { ConversationView } from "@/components/messages/ConversationView";

export default function Messages() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isRtl } = useTranslation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-muted/10" dir={isRtl ? "rtl" : "ltr"}>
      <div className="w-full md:w-80 border-r">
        <ConversationList />
      </div>
      
      <div className="flex-1">
        {conversationId ? (
          <ConversationView conversationId={conversationId} />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            {isRtl ? "اختر محادثة للبدء" : "Select a conversation to start"}
          </div>
        )}
      </div>
    </div>
  );
} 
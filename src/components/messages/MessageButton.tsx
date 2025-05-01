import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/use-translation";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Send } from "lucide-react";

interface MessageButtonProps {
  userId: string;
  username: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

// Diagnostic logger function
const logDiagnostics = async (diagnosticId: string, step: string, data: any, error?: any) => {
  console.group(`[Messaging Diagnostics ${diagnosticId}] Step: ${step}`);
  console.log('Data:', data);
  if (error) {
    console.error('Error:', error);
    // Show more detailed error information
    if (error.message) console.error('Message:', error.message);
    if (error.code) console.error('Code:', error.code);
    if (error.details) console.error('Details:', error.details);
    if (error.hint) console.error('Hint:', error.hint);
  }
  console.groupEnd();
};

export function MessageButton({
  userId,
  username,
  variant = "default",
  size = "default",
  className = "",
}: MessageButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const { isRtl } = useTranslation();
  const navigate = useNavigate();

  const findOrCreateConversation = useMutation({
    mutationFn: async () => {
      // Create a diagnostic ID for this conversation creation attempt
      const diagnosticId = new Date().toISOString();
      
      await logDiagnostics(diagnosticId, 'Start', {
        isAuthenticated,
        currentUser: user ? { id: user.id, username: user.username } : null,
        otherUser: { id: userId, username }
      });

      if (!isAuthenticated || !user) {
        await logDiagnostics(diagnosticId, 'Authentication Check Failed', { isAuthenticated, user });
        throw new Error("You need to be logged in to send messages");
      }

      if (user.id === userId) {
        await logDiagnostics(diagnosticId, 'Self-Messaging Check Failed', { userId, currentUserId: user.id });
        throw new Error("You cannot message yourself");
      }

      try {
        // Test query to check if we can access conversation_participants
        const testResponse = await supabase
          .from("conversation_participants")
          .select("count", { count: "exact", head: true });
          
        await logDiagnostics(diagnosticId, 'Test Query', testResponse);
        
        if (testResponse.error) {
          throw new Error(`RLS policy error: ${testResponse.error.message}`);
        }
        
        // Simpler approach: Get all conversations where both users are participants
        // First get all conversations for the current user
        await logDiagnostics(diagnosticId, 'Fetching User Conversations', { userId: user.id });
        
        const { data: myConversations, error: myError } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", user.id);

        if (myError) {
          await logDiagnostics(diagnosticId, 'Error Fetching User Conversations', null, myError);
          throw myError;
        }
        
        await logDiagnostics(diagnosticId, 'User Conversations Result', { conversationCount: myConversations?.length || 0 });
        
        if (!myConversations || myConversations.length === 0) {
          // No conversations yet, create a new one
          await logDiagnostics(diagnosticId, 'No Existing Conversations Found', { createNew: true });
          return await createNewConversation(diagnosticId, user.id, userId);
        }

        // Get conversations where the other user is a participant
        const myConversationIds = myConversations.map(p => p.conversation_id);
        
        await logDiagnostics(diagnosticId, 'Finding Shared Conversations', { 
          userIds: [user.id, userId],
          conversationIds: myConversationIds 
        });
        
        const { data: sharedConversations, error: sharedError } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", userId)
          .in("conversation_id", myConversationIds);
          
        if (sharedError) {
          await logDiagnostics(diagnosticId, 'Error Finding Shared Conversations', null, sharedError);
          throw sharedError;
        }
        
        await logDiagnostics(diagnosticId, 'Shared Conversations Result', { 
          sharedCount: sharedConversations?.length || 0,
          shared: sharedConversations
        });
        
        if (!sharedConversations || sharedConversations.length === 0) {
          // No shared conversations, create a new one
          await logDiagnostics(diagnosticId, 'No Shared Conversations Found', { createNew: true });
          return await createNewConversation(diagnosticId, user.id, userId);
        }

        // Get more details about these shared conversations to identify direct ones
        const sharedIds = sharedConversations.map(c => c.conversation_id);
        
        await logDiagnostics(diagnosticId, 'Fetching Conversation Details', { sharedIds });
        
        const { data: conversationDetails, error: detailsError } = await supabase
          .from("conversations")
          .select("id, is_group")
          .in("id", sharedIds)
          .eq("is_group", false);
          
        if (detailsError) {
          await logDiagnostics(diagnosticId, 'Error Fetching Conversation Details', null, detailsError);
          throw detailsError;
        }
        
        await logDiagnostics(diagnosticId, 'Conversation Details Result', { 
          detailedCount: conversationDetails?.length || 0,
          details: conversationDetails
        });
        
        if (!conversationDetails || conversationDetails.length === 0) {
          // No suitable direct conversation found
          await logDiagnostics(diagnosticId, 'No Direct Conversations Found', { createNew: true });
          return await createNewConversation(diagnosticId, user.id, userId);
        }
        
        // Use the first direct conversation found
        await logDiagnostics(diagnosticId, 'Found Existing Conversation', { 
          conversationId: conversationDetails[0].id,
          isNew: false
        });
        
        return {
          conversationId: conversationDetails[0].id,
          isNew: false
        };
      } catch (error) {
        await logDiagnostics(diagnosticId, 'Error in findOrCreateConversation', null, error);
        console.error("Error in findOrCreateConversation:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      navigate(`/messages/${data.conversationId}`);
      if (data.isNew) {
        toast.success(
          isRtl
            ? `تم إنشاء محادثة جديدة مع ${username}`
            : `New conversation started with ${username}`
        );
      }
    },
    onError: (error: any) => {
      if (error.message === "You cannot message yourself") {
        toast.error(
          isRtl
            ? "لا يمكنك إرسال رسائل إلى نفسك"
            : "You cannot message yourself"
        );
      } else if (error.message === "You need to be logged in to send messages") {
        toast.error(
          isRtl
            ? "يجب أن تكون مسجلا الدخول لإرسال الرسائل"
            : "You need to be logged in to send messages"
        );
        // Optional: Redirect to login
        navigate("/login");
      } else {
        const errorMessage = error.code ? `${error.message} (${error.code})` : error.message;
        toast.error(
          isRtl
            ? `حدث خطأ أثناء إنشاء المحادثة: ${errorMessage}`
            : `Error creating conversation: ${errorMessage}`
        );
        console.error("Message error:", error);
        
        // Show an alert with detailed error diagnostics for easier debugging
        if (process.env.NODE_ENV !== 'production') {
          const detailedError = {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          };
          alert(`Messaging Error Diagnostics:\n${JSON.stringify(detailedError, null, 2)}`);
        }
      }
    }
  });

  // Helper function to create a new conversation
  const createNewConversation = async (diagnosticId: string, currentUserId: string, otherUserId: string) => {
    await logDiagnostics(diagnosticId, 'Creating New Conversation - Start', {
      currentUserId,
      otherUserId
    });
    
    try {
      // Create the conversation
      const { data: newConversation, error: createError } = await supabase
        .from("conversations")
        .insert({
          is_group: false,
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        await logDiagnostics(diagnosticId, 'Error Creating Conversation', null, createError);
        throw createError;
      }
      
      await logDiagnostics(diagnosticId, 'Conversation Created', newConversation);

      // Add both users as participants
      await logDiagnostics(diagnosticId, 'Adding Participants - Start', {
        conversationId: newConversation.id,
        participants: [currentUserId, otherUserId]
      });
      
      const { data: participants, error: participantsError } = await supabase
        .from("conversation_participants")
        .insert([
          { 
            conversation_id: newConversation.id, 
            user_id: currentUserId,
            last_read_at: new Date().toISOString()
          },
          { 
            conversation_id: newConversation.id, 
            user_id: otherUserId,
            last_read_at: null
          }
        ])
        .select();

      if (participantsError) {
        await logDiagnostics(diagnosticId, 'Error Adding Participants', null, participantsError);
        throw participantsError;
      }
      
      await logDiagnostics(diagnosticId, 'Participants Added', participants);

      // Create initial welcome message to properly initialize the conversation
      try {
        const welcomeMessage = isRtl ? "مرحباً! أرسل لي رسالة." : "Hi there! Send me a message.";
        
        await logDiagnostics(diagnosticId, 'Creating Welcome Message - Start', {
          conversationId: newConversation.id,
          senderId: currentUserId,
          message: welcomeMessage
        });
        
        const { data: message, error: messageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: newConversation.id,
            content: welcomeMessage,
            media_url: null,
            media_type: 'text',
            sender_id: currentUserId
          })
          .select();
          
        if (messageError) {
          await logDiagnostics(diagnosticId, 'Error Creating Welcome Message', null, messageError);
          console.error("Failed to create welcome message:", messageError);
          // Continue even if welcome message fails
        } else {
          await logDiagnostics(diagnosticId, 'Welcome Message Created', message);
        }
      } catch (messageError) {
        await logDiagnostics(diagnosticId, 'Exception Creating Welcome Message', null, messageError);
        console.error("Exception creating welcome message:", messageError);
        // Continue even if welcome message fails
      }

      await logDiagnostics(diagnosticId, 'New Conversation Process Complete', {
        conversationId: newConversation.id,
        isNew: true
      });
      
      return { conversationId: newConversation.id, isNew: true };
    } catch (error) {
      await logDiagnostics(diagnosticId, 'Error in createNewConversation', null, error);
      throw error;
    }
  };

  const handleClick = () => {
    findOrCreateConversation.mutate();
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={findOrCreateConversation.isPending || !isAuthenticated || user?.id === userId}
      className={className}
    >
      <Send className="mr-2 h-4 w-4" />
      {findOrCreateConversation.isPending
        ? (isRtl ? "جاري التحميل..." : "Loading...")
        : (isRtl ? "مراسلة" : "Message")}
    </Button>
  );
} 
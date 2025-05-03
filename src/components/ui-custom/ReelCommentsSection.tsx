import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useReels, ReelCommentWithUser } from "@/hooks/use-reels";
import { useAuth } from "@/contexts/AuthContext";
import { FormattedText } from "./FormattedText";
import { useTranslation } from "@/hooks/use-translation";
import { Trash2 } from "lucide-react";
import { Spinner } from "./Loaders";

interface ReelCommentsSectionProps {
  reelId: string;
}

export function ReelCommentsSection({ reelId }: ReelCommentsSectionProps) {
  const { isRtl } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { addReelComment, deleteReelComment, useReelComments } = useReels();
  const { comments, commentsLoading, refetchComments } = useReelComments(reelId);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await addReelComment(reelId, newComment);
      setNewComment("");
      refetchComments();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm(isRtl ? "هل أنت متأكد من حذف هذا التعليق؟" : "Are you sure you want to delete this comment?")) {
      await deleteReelComment(commentId, reelId);
      refetchComments();
    }
  };

  return (
    <div className="space-y-4 py-2">
      <h3 className="text-lg font-medium border-b pb-2">
        {isRtl ? "التعليقات" : "Comments"} ({comments.length})
      </h3>
      
      {isAuthenticated && (
        <form onSubmit={handleSubmitComment} className="flex gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={isRtl ? "اكتب تعليقاً..." : "Write a comment..."}
            disabled={isSubmitting}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? (
              <Spinner size="sm" />
            ) : (
              isRtl ? "تعليق" : "Comment"
            )}
          </Button>
        </form>
      )}
      
      {commentsLoading ? (
        <div className="py-4 text-center">
          <Spinner />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          {isRtl ? "لا توجد تعليقات بعد. كن أول من يعلق!" : "No comments yet. Be the first to comment!"}
        </div>
      ) : (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {comments.map((comment) => (
            <CommentItem 
              key={comment.id} 
              comment={comment} 
              onDelete={handleDeleteComment}
              isOwner={isAuthenticated && user?.id === comment.user.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: ReelCommentWithUser;
  onDelete: (commentId: string) => void;
  isOwner: boolean;
}

function CommentItem({ comment, onDelete, isOwner }: CommentItemProps) {
  const { isRtl } = useTranslation();
  
  const formattedDate = formatDistanceToNow(comment.createdAt, {
    addSuffix: true,
    locale: isRtl ? ar : undefined
  });

  return (
    <div className="flex gap-3 group">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={comment.user.avatar} alt={comment.user.displayName} />
        <AvatarFallback>{comment.user.displayName.charAt(0)}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-3">
          <a href={`/profile/${comment.user.id}`}>
            <span className="font-medium text-sm">{comment.user.displayName}</span>
          </a>
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
        </div>
        <div className="bg-muted p-2 rounded-md">
          <div className="flex items-center justify-between">
            
              <FormattedText text={comment.content} className="text-sm mt-1" />
              {isOwner && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 opacity-100 transition-opacity"
                  onClick={() => onDelete(comment.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              )}
            
          </div>
        </div>
      </div>
    </div>
  );
} 
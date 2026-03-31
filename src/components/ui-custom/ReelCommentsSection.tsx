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
import { cn } from "@/lib/utils";

const mockComments: ReelCommentWithUser[] = [
  {
    id: "mock-comment-1",
    reelId: "demo-reel-1",
    content: "فيديو رائع! 👏",
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
    user: {
      id: "user-1",
      username: "art_fan",
      displayName: "محب الفن",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"
    }
  },
  {
    id: "mock-comment-2",
    reelId: "demo-reel-1",
    content: "جميل جداً، شكراً لمشاركته",
    createdAt: new Date(Date.now() - 1000 * 60 * 15),
    user: {
      id: "user-2",
      username: "creative_soul",
      displayName: "روح إبداعية",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"
    }
  },
  {
    id: "mock-comment-3",
    reelId: "demo-reel-1",
    content: "هذا العمل يحتاج موهبة خاصة 🔥",
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    user: {
      id: "user-3",
      username: "art_lover",
      displayName: "هاوي فن",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"
    }
  }
];

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

  const isDemo = reelId === "demo-reel-1" || reelId === "1" || reelId === "demo";
  const displayComments = isDemo ? mockComments : comments;
  const totalComments = isDemo ? mockComments.length : comments.length;

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
        {isRtl ? "التعليقات" : "Comments"} ({totalComments})
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
      
      {commentsLoading && !isDemo ? (
        <div className="py-4 text-center">
          <Spinner />
        </div>
      ) : displayComments.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          {isRtl ? "لا توجد تعليقات بعد. كن أول من يعلق!" : "No comments yet. Be the first to comment!"}
        </div>
      ) : (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {displayComments.map((comment) => (
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
            
              <FormattedText text={comment.content} className={cn("text-sm mt-1", isRtl ? "text-right" : "text-left")} />
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
import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Heart, MessageCircle, Send, Share2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { FormattedText } from "./FormattedText";
import { useNotificationsApi } from "@/hooks/use-notifications-api";

export interface Comment {
  id: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
  };
  content: string;
  createdAt: Date;
  likes: number;
  isLiked?: boolean;
}

export interface PostDetailProps {
  post: {
    id: string;
    user: {
      id: string;
      username: string;
      displayName: string;
      avatar: string;
    };
    content: string;
    image?: string;
    image_url?: string;
    createdAt: Date;
    created_at?: string;
    likes: number;
    comments: number;
    isLiked?: boolean;
  };
  comments: Comment[];
  onCommentSubmit: (commentText: string) => Promise<void>;
  onCommentLike: (commentId: string) => void;
  onPostLike: () => void;
  onShare: () => void;
  isLoading?: boolean;
}

export function PostDetail({
  post,
  comments,
  onCommentSubmit,
  onCommentLike,
  onPostLike,
  onShare,
  isLoading = false
}: PostDetailProps) {
  const { user, isAuthenticated } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { sendInteractionNotification } = useNotificationsApi();
  
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error("يرجى تسجيل الدخول للتعليق");
      return;
    }
    
    if (!commentText.trim()) {
      toast.error("يرجى كتابة تعليق");
      return;
    }
    
    setSubmitting(true);
    
    try {
      await onCommentSubmit(commentText);
      setCommentText("");
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleCommentLike = (commentId: string) => {
    if (!isAuthenticated) {
      toast.error("يرجى تسجيل الدخول للإعجاب بالتعليقات");
      return;
    }
    
    onCommentLike(commentId);
  };
  
  const handlePostLike = () => {
    if (!isAuthenticated) {
      toast.error("يرجى تسجيل الدخول للإعجاب بالمنشورات");
      return;
    }
    
    onPostLike();
  };
  
  const handleShare = () => {
    onShare();
  };

  // Helper function to handle different date formats
  const getFormattedDate = () => {
    if (post.createdAt instanceof Date) {
      return formatDistanceToNow(post.createdAt, { addSuffix: true, locale: ar });
    } else if (post.created_at) {
      return formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ar });
    }
    return "";
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-1/3 bg-muted animate-pulse" />
            <div className="h-3 w-1/4 bg-muted animate-pulse" />
          </div>
        </div>
        
        <div className="h-4 w-full mb-2 bg-muted animate-pulse" />
        <div className="h-4 w-5/6 mb-2 bg-muted animate-pulse" />
        <div className="h-4 w-4/6 mb-6 bg-muted animate-pulse" />
        
        <div className="h-96 w-full rounded-lg mb-6 bg-muted animate-pulse" />
        
        <div className="flex justify-between mb-6">
          <div className="h-8 w-24 bg-muted animate-pulse" />
          <div className="h-8 w-24 bg-muted animate-pulse" />
          <div className="h-8 w-24 bg-muted animate-pulse" />
        </div>
        
        <div className="h-32 w-full rounded-lg mb-8 bg-muted animate-pulse" />
        
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-1/4 bg-muted animate-pulse" />
                <div className="h-4 w-full bg-muted animate-pulse" />
                <div className="h-4 w-5/6 bg-muted animate-pulse" />
                <div className="flex gap-4 pt-2">
                  <div className="h-6 w-16 bg-muted animate-pulse" />
                  <div className="h-6 w-16 bg-muted animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link to={`/profile/${post.user.username}`}>
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={post.user.avatar} alt={post.user.displayName} />
              <AvatarFallback>{post.user.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
          </Link>
          
          <div>
            <Link 
              to={`/profile/${post.user.username}`}
              className="font-medium hover:text-primary transition-colors"
            >
              {post.user.displayName}
            </Link>
            <div className="flex items-center text-sm text-muted-foreground">
              <Link 
                to={`/profile/${post.user.username}`}
                className="hover:text-foreground transition-colors"
              >
                @{post.user.username}
              </Link>
              <span className="mx-1">•</span>
              <span>{getFormattedDate()}</span>
            </div>
          </div>
        </div>
        
        <div className="text-lg mb-6">
          <FormattedText text={post.content} className="text-lg leading-relaxed" />
        </div>
        
        {(post.image_url || post.image) && (
          <div className="rounded-lg overflow-hidden bg-muted/20 mb-6">
            <img 
              src={post.image_url || post.image} 
              alt="Post attachment" 
              className="w-full h-auto object-cover max-h-[600px]"
            />
          </div>
        )}
        
        <div className="flex justify-between items-center py-4">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${post.isLiked ? 'text-primary' : ''}`}
            onClick={handlePostLike}
          >
            <Heart className={`h-5 w-5 ${post.isLiked ? 'fill-primary' : ''}`} />
            <span>{post.likes} إعجاب</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <MessageCircle className="h-5 w-5" />
            <span>{comments.length} تعليق</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5" />
            <span>مشاركة</span>
          </Button>
        </div>
        
        <Separator className="my-6" />
      </div>
      
      {/* Comment form */}
      <div className="mb-8">
        <form onSubmit={handleCommentSubmit}>
          <div className="flex gap-3">
            {isAuthenticated ? (
              <Avatar className="h-10 w-10 border">
                <AvatarImage src={user?.avatar} alt={user?.displayName} />
                <AvatarFallback>{user?.displayName?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
            ) : (
              <Avatar className="h-10 w-10 border">
                <AvatarFallback>؟</AvatarFallback>
              </Avatar>
            )}
            
            <div className="flex-1">
              <Textarea
                placeholder={isAuthenticated ? "أضف تعليقاً..." : "سجل دخول لإضافة تعليق"}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                disabled={!isAuthenticated || submitting}
                className="min-h-24 resize-none mb-2 bg-secondary/30 border-none focus-visible:ring-1"
              />
              
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!isAuthenticated || submitting || !commentText.trim()}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  <span>إضافة تعليق</span>
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
      
      {/* Comments */}
      <div className="space-y-6">
        <h3 className="font-display font-bold text-xl mb-4">التعليقات ({comments.length})</h3>
        
        {comments.length === 0 ? (
          <div className="text-center py-10 border rounded-lg">
            <h4 className="text-lg font-medium mb-2">لا توجد تعليقات بعد</h4>
            <p className="text-muted-foreground">كن أول من يعلق على هذا المنشور</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Link to={`/profile/${comment.user.username}`}>
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={comment.user.avatar} alt={comment.user.displayName} />
                  <AvatarFallback>{comment.user.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
              </Link>
              
              <div className="flex-1">
                <div className="bg-secondary/30 p-3 rounded-lg">
                  <div className="flex justify-between items-start">
                    <Link 
                      to={`/profile/${comment.user.username}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {comment.user.displayName}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(comment.createdAt, { 
                        addSuffix: true,
                        locale: ar 
                      })}
                    </span>
                  </div>
                  <p className="mt-1">{comment.content}</p>
                </div>
                
                <div className="flex items-center gap-4 mt-2 mr-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 px-2 gap-1 text-sm ${comment.isLiked ? 'text-primary' : ''}`}
                    onClick={() => handleCommentLike(comment.id)}
                  >
                    <Heart className={`h-4 w-4 ${comment.isLiked ? 'fill-primary' : ''}`} />
                    <span>{comment.likes > 0 ? comment.likes : 'إعجاب'}</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 gap-1 text-sm"
                    disabled={!isAuthenticated}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>رد</span>
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 
import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from 'framer-motion';
import { ShareModal } from "./ShareModal";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

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
    images?: string[];
    videos?: string[];
    gifs?: string[];
    media_urls?: string[];
    media_type?: 'images' | 'video' | 'gif' | null;
    createdAt: Date;
    created_at?: string;
    likes: number;
    isLiked: boolean;
    comments: number;
  };
  comments: Comment[];
  onCommentSubmit: (commentText: string) => Promise<void>;
  onCommentLike: (commentId: string) => Promise<void>;
  onPostLike: () => Promise<void>;
  onShare: () => void;
  isLoading?: boolean;
}

export function PostDetail({
  post,
  comments,
  onCommentSubmit,
  onShare,
  isLoading = false
}: PostDetailProps) {
  const { user, isAuthenticated } = useAuth();
  const { isRtl } = useTranslation();
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { sendInteractionNotification } = useNotificationsApi();
  const [localLikes, setLocalLikes] = useState(post?.likes || 0);
  const [localIsLiked, setLocalIsLiked] = useState(post?.isLiked || false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Subscribe to real-time updates for likes
  useEffect(() => {
    if (!post?.id) return;

    const channel = supabase
      .channel(`post_likes_${post.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_likes',
          filter: `post_id=eq.${post.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLocalLikes(prev => prev + 1);
          } else if (payload.eventType === 'DELETE') {
            setLocalLikes(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [post?.id]);

  // Update local state when post changes
  useEffect(() => {
    if (post) {
      setLocalLikes(post.likes || 0);
      setLocalIsLiked(post.isLiked || false);
    }
  }, [post]);

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
  

  
  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  // Helper function to handle different date formats
  const getFormattedDate = () => {
    if (!post) return "";
    
    if (post.createdAt instanceof Date) {
      return formatDistanceToNow(post.createdAt, { addSuffix: true, locale: ar });
    } else if (post.created_at) {
      return formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ar });
    }
    return "";
  };

  if (isLoading || !post) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in items-center bg-background rounded-lg p-6">
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
    <div className="max-w-3xl mx-auto animate-fade-in items-center bg-background rounded-lg p-6">
      <div className="mb-6 items-center">
        <div className="flex items-center gap-3 mb-4 ">
          <Link to={`/profile/${post.user.username}`}>
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={post.user.avatar} alt={post.user.displayName} />
              <AvatarFallback>{post.user.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="align-start flex gap-3 items-center">
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
        
        <div className="text-lg mb-6 align-start flex text-foreground">
          <FormattedText text={post.content} />
        </div>
        
        {(post.images?.length > 0 && !post.media_urls) && (
        <div className={`grid ${post.images?.length === 1 ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-2'} gap-2 mb-4`}>
          {post.images.map((image, index) => {
            const isVideo = ['.mp4', '.webm', '.ogg'].some(ext => image.toLowerCase().endsWith(ext));
            return isVideo ? (
              <video
                key={index}
                src={image}
                controls
                autoPlay
                loop
                className={`w-full ${post.images?.length === 1 ? 'h-96' : 'h-64'} object-cover rounded-md`}
                onContextMenu={(e) => e.preventDefault()}
                controlsList="nodownload"
              />
            ) : (
              <img
                key={index}
                src={image}
                alt=""
                className={`w-full ${post.images?.length === 1 ? 'h-96' : 'h-64'} object-cover rounded-md`}
                onContextMenu={(e) => e.preventDefault()}
                draggable={false}
              />
            );
          })}
        </div>
      )}
        
        <div className="flex items-center justify-between mb-6">
          <Button
              variant="ghost"
              size="sm"
              className="gap-2 hover:bg-secondary"
              onClick={async () => {
                 if (!isAuthenticated) {
                   toast.error("يرجى تسجيل الدخول للإعجاب بالمنشورات");
                   return;
                 }
                 
                 // Optimistic update
                 const wasLiked = localIsLiked;
                 setLocalIsLiked(!wasLiked);
                 setLocalLikes(prev => wasLiked ? Math.max(0, prev - 1) : prev + 1);
                 
                 try {
                   if (wasLiked) {
                     // Unlike the post
                     const { error } = await supabase
                       .from('post_likes')
                       .delete()
                       .eq('post_id', post.id)
                       .eq('user_id', user?.id);
                       
                     if (error) throw error;
                     toast.success('تم إزالة الإعجاب بنجاح');
                   } else {
                     // Like the post
                     const { error } = await supabase
                       .from('post_likes')
                       .upsert(
                         { 
                           post_id: post.id, 
                           user_id: user?.id,
                           created_at: new Date().toISOString()
                         },
                         { onConflict: 'post_id,user_id' }
                       );
                       
                     if (error) throw error;
                     toast.success('تم تسجيل الإعجاب بنجاح');
                   }
                 } catch (error) {
                   // Revert optimistic update on error
                   setLocalIsLiked(wasLiked);
                   setLocalLikes(prev => wasLiked ? prev + 1 : Math.max(0, prev - 1));
                   toast.error('حدث خطأ أثناء تحديث الإعجاب');
                   console.error('Like error:', error);
                 }
                 }
              }
            >
                <motion.div 
                  whileTap={{ scale: 1.2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                <Heart 
                  className="h-5 w-5" 
                  fill={localIsLiked ? "#3b82f6" : "none"}
                  style={{ color: localIsLiked ? "#3b82f6" : "currentColor" }}
                />
              </motion.div>
              <AnimatePresence mode="wait">
                <motion.span
                  key={localLikes}
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 10, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  {localLikes} إعجاب
                </motion.span>
              </AnimatePresence>
            </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 hover:bg-secondary"
          >
            <MessageCircle className="h-5 w-5" />
            <span>{comments.length} تعليق</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 hover:bg-secondary"
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
        <h3 className="font-display font-bold text-xl mb-4 text-foreground">التعليقات ({comments.length})</h3>
        
        {comments.length === 0 ? (
          <div className="text-center py-10 border rounded-lg bg-secondary/30">
            <h4 className="text-lg font-medium mb-2 text-foreground">لا توجد تعليقات بعد</h4>
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
                        locale: isRtl ? ar : undefined 
                      })}
                    </span>
                  </div>
                  <p className={cn("mt-1 text-foreground", isRtl ? "text-right" : "text-left")}>{comment.content}</p>
                </div>
                
                <div className="flex items-center gap-4 mt-2 mr-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 gap-1 text-sm hover:bg-secondary"
                    onClick={async () => {
                      if (!isAuthenticated) {
                        toast.error("يرجى تسجيل الدخول للإعجاب بالتعليقات");
                        return;
                      }
                      
                      if (comment.isLiked) {
                        // Unlike the comment
                        const { error } = await supabase
                          .from('comment_likes')
                          .delete()
                          .eq('comment_id', comment.id)
                          .eq('user_id', user?.id);
                          
                        if (error) {
                          toast.error('حدث خطأ أثناء إزالة الإعجاب');
                        } else {
                          toast.success('تم إزالة الإعجاب بنجاح');
                          comment.isLiked = false;
                          comment.likes = Math.max(0, (comment.likes || 0) - 1);
                        }
                      } else {
                        // Like the comment
                        const { error } = await supabase
                          .from('comment_likes')
                          .upsert(
                            { 
                              comment_id: comment.id, 
                              user_id: user?.id,
                              created_at: new Date().toISOString()
                            },
                            { onConflict: 'comment_id,user_id' }
                          );
                          
                        if (error) {
                          toast.error('حدث خطأ أثناء تسجيل الإعجاب');
                        } else {
                          toast.success('تم تسجيل الإعجاب بنجاح');
                          comment.isLiked = true;
                          comment.likes = (comment.likes || 0) + 1;
                        }
                      }
                    }}
                  >
                    <Heart className="h-4 w-4" fill={comment.isLiked ? "currentColor" : "none"} />
                    <span>{comment.likes > 0 ? comment.likes : 'إعجاب'}</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 gap-1 text-sm hover:bg-secondary"
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

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        url={`${window.location.origin}/post/${post.id}`}
        title={post.content}
        description={`Check out this post by ${post.user.displayName}`}
        type="post"
        author={post.user}
        image={post.images?.[0] || post.media_urls?.[0]}
      />
    </div>
  );
}
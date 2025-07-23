import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Heart, MessageCircle, Share2, UserPlus, UserMinus, MoreVertical, Edit, Trash2, Flag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/use-translation";
import { FollowListModal } from "@/components/ui-custom/FollowListModal";
import { motion, AnimatePresence } from "framer-motion";
import { ShareModal } from "./ShareModal";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import type { TablesInsert } from '@/integrations/supabase/types';

export interface Post {
  id: string;
  content: string;
  image?: string;
  media_urls?: string[];
  media_type?: 'images' | 'video' | 'gif' | null;
  images?: string[];
  videos?: string[];
  createdAt: Date;
  likes: number;
  isLiked: boolean;
  comments: number;
  tags?: string[];
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    followers_count?: number;
  };
}

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => Promise<void>;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onDelete?: () => void;
}

export function PostCard({ post, onLike, onComment, onShare, onDelete }: PostCardProps) {
  const { user, isAuthenticated } = useAuth();
  const { t, isRtl } = useTranslation();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localLikes, setLocalLikes] = useState(post.likes);
  const [localIsLiked, setLocalIsLiked] = useState(post.isLiked);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const isOwner = isAuthenticated && user?.id === post.user.id;
  const canEdit = isOwner && (Date.now() - new Date(post.createdAt).getTime() < 60000);

  useEffect(() => {
    const checkLikeAndFollowStatus = async () => {
      if (!isAuthenticated || !user) return;

      try {
        // Check if the post exists first
        const { count, error: checkError } = await supabase
          .from("posts")
          .select("*", { count: "exact", head: false })
          .eq("id", post.id);
          
        if (checkError) {
          console.error("Error checking post existence:", checkError);
          return;
        }

        if (count === 0) {
          console.error("Post not found");
          return;
        }
        
        // Check if following the post author
        if (user.id !== post.user.id) {
          const { data: isFollowingData } = await supabase
            .rpc('is_following', {
              follower_id: user.id,
              following_id: post.user.id
            });
          setIsFollowing(isFollowingData);
        }

        // Get follower count for the post author
        const { data: profileData } = await supabase
          .from('profiles')
          .select(`
            followers_count,
            followers!followers_following_id_fkey (
              follower:profiles!followers_follower_id_fkey (
                id
              )
            )
          `)
          .eq('id', post.user.id)
          .single();

        if (profileData) {
          post.user.followers_count = profileData.followers?.length || 0;
        }
      } catch (error) {
        console.error('Error checking like and follow status:', error);
      }
    };

    checkLikeAndFollowStatus();
  }, [isAuthenticated, user, post.id, post.user.id]);

  // Subscribe to real-time updates for likes
  useEffect(() => {
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
  }, [post.id]);

  const handleFollow = async () => {
    if (!isAuthenticated || !user || user.id === post.user.id) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('followers')
          .delete()
          .match({
            follower_id: user.id,
            following_id: post.user.id
          });

        if (error) throw error;
        setIsFollowing(false);
        
        // Refresh the post user's profile to get updated follower count
        const { data: updatedProfile, error: refreshError } = await supabase
          .from("profiles")
          .select("followers_count")
          .eq("id", post.user.id)
          .single();
          
        if (!refreshError && updatedProfile) {
          // Update the post object with the new follower count
          post.user.followers_count = updatedProfile.followers_count || 0;
        }
        
        toast.success(isRtl ? "تم إلغاء المتابعة بنجاح" : "Successfully unfollowed");
      } else {
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: user.id,
            following_id: post.user.id
          });

        if (error) throw error;
        setIsFollowing(true);
        
        // Refresh the post user's profile to get updated follower count
        const { data: updatedProfile, error: refreshError } = await supabase
          .from("profiles")
          .select("followers_count")
          .eq("id", post.user.id)
          .single();
          
        if (!refreshError && updatedProfile) {
          // Update the post object with the new follower count
          post.user.followers_count = updatedProfile.followers_count || 0;
        }
        
        toast.success(isRtl ? "تم المتابعة بنجاح" : "Successfully followed");
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error(isRtl ? "حدث خطأ أثناء تحديث المتابعة" : "Error updating follow status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  // Delete post handler
  const handleDeletePost = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success(isRtl ? "تم حذف المنشور" : "Post deleted");
      setIsDeleteDialogOpen(false);
      if (onDelete) onDelete();
    } catch (error) {
      toast.error(isRtl ? "حدث خطأ أثناء حذف المنشور" : "Error deleting post");
    } finally {
      setIsLoading(false);
    }
  };

  // Edit post handler
  const handleEditPost = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('posts')
        .update({ content: editContent })
        .eq('id', post.id)
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success(isRtl ? "تم تعديل المنشور" : "Post updated");
      setIsEditMode(false);
      // Optionally: update UI
    } catch (error) {
      toast.error(isRtl ? "حدث خطأ أثناء تعديل المنشور" : "Error updating post");
    } finally {
      setIsLoading(false);
    }
  };

  const reportPost = async (postId: string, reason: string): Promise<boolean> => {
    if (!isAuthenticated || !user) {
      toast.error(t('report') + ': ' + (isRtl ? "يجب تسجيل الدخول للإبلاغ عن منشور" : "You must be logged in to report a post"));
      return false;
    }
    if (!reason.trim()) {
      toast.error(t('report') + ': ' + t('reportReason'));
      return false;
    }
    try {
      // Check if the user has already reported this post
      const { data: existingReport, error: checkError } = await supabase
        .from("reports")
        .select()
        .eq("content_type", "post")
        .eq("content_id", postId)
        .eq("reporter_id", user.id)
        .maybeSingle();
      if (checkError) {
        console.error("Error checking existing report:", checkError);
        toast.error(t('report') + ': ' + (isRtl ? "تعذر التحقق من حالة البلاغ" : "Could not check report status"));
        return false;
      }
      if (existingReport) {
        toast.info(t('alreadyReported'));
        return false;
      }
      // Create a report
      const reportPayload: TablesInsert<'reports'> = {
        reporter_id: user.id,
        reported_id: post.user.id,
        content_type: "post",
        content_id: postId,
        reason: reason.trim(),
        status: "pending"
      };
      const { error: reportError } = await supabase
        .from("reports")
        .insert(reportPayload);
      if (reportError) {
        console.error("Error reporting post:", reportError);
        toast.error(t('report') + ': ' + (isRtl ? "فشل الإبلاغ عن المنشور" : "Failed to report post"));
        return false;
      }
      toast.success(t('reportSuccess'));
      return true;
    } catch (error) {
      console.error("Error in reportPost:", error);
      toast.error(t('report') + ': ' + (isRtl ? "حدث خطأ ما. يرجى المحاولة مرة أخرى." : "Something went wrong. Please try again."));
      return false;
    }
  };

  return (
    <div className={`bg-card rounded-lg border p-4 space-y-5 w-full ${isRtl ? 'direction-rtl' : ''}`}>
      
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.user.username}`}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.user.avatar} alt={post.user.displayName} />
              <AvatarFallback>{post.user.displayName[0]}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link 
                to={`/profile/${post.user.username}`}
                className="font-medium hover:underline"
              >
                {post.user.displayName}
              </Link>
              {isAuthenticated && user && user.id !== post.user.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (!isAuthenticated || !user || user.id === post.user.id) return;
                    
                    setIsLoading(true);
                    try {
                      if (isFollowing) {
                        const { error } = await supabase
                          .from('followers')
                          .delete()
                          .match({
                            follower_id: user.id,
                            following_id: post.user.id
                          });
                        
                        if (error) throw error;
                        setIsFollowing(false);
                        toast.success(isRtl ? "تم إلغاء المتابعة بنجاح" : "Successfully unfollowed");
                      } else {
                        const { error } = await supabase
                          .from('followers')
                          .insert({
                            follower_id: user.id,
                            following_id: post.user.id
                          });
                        
                        if (error) throw error;
                        setIsFollowing(true);
                        toast.success(isRtl ? "تم المتابعة بنجاح" : "Successfully followed");
                      }
                    } catch (error) {
                      console.error('Error toggling follow:', error);
                      toast.error(isRtl ? "حدث خطأ أثناء تحديث المتابعة" : "Error updating follow status");
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="h-3 w-3 mr-1" />
                      {isRtl ? "إلغاء المتابعة" : "Unfollow"}
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3 w-3 mr-1" />
                      {isRtl ? "متابعة" : "Follow"}
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="flex text-sm text-muted-foreground">
              <Link 
                to={`/profile/${post.user.username}`}
                className="hover:underline"
              >
                @{post.user.username}
              </Link>
              {post.user.followers_count !== undefined && (
                <>
                  <span className="mx-1">•</span>
                  <FollowListModal
                    userId={post.user.id}
                    username={post.user.username}
                    followersCount={post.user.followers_count}
                    followingCount={0}
                    trigger={
                      <span className="hover:underline cursor-pointer">
                        {post.user.followers_count} {isRtl ? "متابع" : "followers"}
                      </span>
                    }
                  />
                </>
              )}
              <span className="mx-1">•</span>
              <span>
                {formatDistanceToNow(post.createdAt, { 
                  addSuffix: true,
                  locale: isRtl ? ar : undefined
                })}
              </span>
              
            </div>
          </div>
        </div>
        {isOwner ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem 
                  onClick={() => setIsEditMode(true)}
                  dir={isRtl ? "rtl" : "ltr"}
                >
                  <Edit className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                  {isRtl ? "تعديل" : "Edit"}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                className="text-destructive" 
                onClick={() => setIsDeleteDialogOpen(true)}
                dir={isRtl ? "rtl" : "ltr"}
              >
                <Trash2 className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {isRtl ? "حذف" : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => setIsReportDialogOpen(true)}
                dir={isRtl ? "rtl" : "ltr"}
              >
                <Flag className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {isRtl ? "الإبلاغ عن المنشور" : "Report Post"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {isEditMode ? (
        <div className="mb-4">
          <textarea
            className="w-full border rounded p-2 mb-2"
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            rows={3}
            disabled={isLoading}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleEditPost} disabled={isLoading}>
              {isRtl ? "حفظ" : "Save"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsEditMode(false)}>
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
          </div>
        </div>
      ) : (
      <Link to={`/post/${post.id}`} className="block">
        <p className="text-sm whitespace-pre-wrap text-start p-3">{post.content}</p>
      </Link>
      )}

      {(post.images?.length > 0 && !post.media_urls) && (
        <Link to={`/post/${post.id}`} className="block">
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
        </Link>
      )}

      

      <div className="flex items-center gap-4 pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={async () => {
            if (!isAuthenticated) {
              toast.error(isRtl ? "يرجى تسجيل الدخول للإعجاب بالمنشورات" : "Please login to like posts");
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
                toast.success(isRtl ? 'تم إزالة الإعجاب بنجاح' : 'Successfully unliked');
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
                toast.success(isRtl ? 'تم تسجيل الإعجاب بنجاح' : 'Successfully liked');
              }
            } catch (error) {
              // Revert optimistic update on error
              setLocalIsLiked(wasLiked);
              setLocalLikes(prev => wasLiked ? prev + 1 : Math.max(0, prev - 1));
              toast.error(isRtl ? 'حدث خطأ أثناء تحديث الإعجاب' : 'Error updating like status');
              console.error('Like error:', error);
            }
          }}
        >
          <motion.div 
            whileTap={{ scale: 1.2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Heart 
              className="h-4 w-4" 
              fill={localIsLiked ? "currentColor" : "none"}
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
              {localLikes}
            </motion.span>
          </AnimatePresence>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => onComment?.(post.id)}
        >
          <MessageCircle className="h-4 w-4" />
          <span>{post.comments}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" />
        </Button>
        {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Link 
              key={tag} 
              to={`/explore/tag/${tag}`}
              className="text-sm text-primary hover:underline"
            >
              #{tag}
            </Link>
          ))}
        </div>
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

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRtl ? "حذف المنشور" : "Delete Post"}</DialogTitle>
            <DialogDescription>{isRtl ? "هل أنت متأكد من حذف هذا المنشور؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to delete this post? This action cannot be undone."}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{isRtl ? "إلغاء" : "Cancel"}</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeletePost} disabled={isLoading}>
              {isLoading ? (isRtl ? "جارٍ الحذف..." : "Deleting...") : (isRtl ? "حذف" : "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRtl ? "الإبلاغ عن منشور" : "Report Post"}</DialogTitle>
            <DialogDescription>{isRtl ? "يرجى اختيار سبب الإبلاغ عن هذا المنشور. سيقوم فريقنا بمراجعته." : "Please select a reason for reporting this post. Our team will review it."}</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <select
              className="w-full border rounded p-2 mb-2 dark:bg-muted dark:text-foreground dark:border-muted"
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              disabled={isSubmittingReport}
            >
              <option value="">{isRtl ? "اختر السبب" : "Select reason"}</option>
              <option value="spam">{isRtl ? "سبام / محتوى مزعج" : "Spam"}</option>
              <option value="theft">{isRtl ? "سرقة / محتوى مسروق" : "Theft"}</option>
              <option value="other">{isRtl ? "أخرى" : "Other"}</option>
            </select>
            {reportReason === "other" && (
              <textarea
                className="w-full border rounded p-2 mb-2 dark:bg-muted dark:text-foreground dark:border-muted"
                placeholder={isRtl ? "يرجى توضيح السبب..." : "Please specify..."}
                value={reportReason === "other" ? reportReason : ""}
                onChange={e => setReportReason(e.target.value)}
                disabled={isSubmittingReport}
              />
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{isRtl ? "إلغاء" : "Cancel"}</Button>
            </DialogClose>
            <Button variant="destructive" onClick={async () => {
              setIsSubmittingReport(true);
              await reportPost(post.id, reportReason);
              setIsSubmittingReport(false);
              setIsReportDialogOpen(false);
            }} disabled={isSubmittingReport || !reportReason}>
              {isSubmittingReport ? t('reporting') : t('report')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

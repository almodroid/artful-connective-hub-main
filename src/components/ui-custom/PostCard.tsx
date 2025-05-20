import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Heart, MessageCircle, Share2, UserPlus, UserMinus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/use-translation";
import { FollowListModal } from "@/components/ui-custom/FollowListModal";

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
}

export function PostCard({ post, onLike, onComment, onShare }: PostCardProps) {
  const { user, isAuthenticated } = useAuth();
  const { t, isRtl } = useTranslation();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkLikeAndFollowStatus = async () => {
      if (!isAuthenticated || !user) return;

      try {
        // Check if the post exists first
        const { count, error: checkError } = await supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
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

  return (
    <div className={`bg-card rounded-lg border p-4 space-y-5 m-5 ${isRtl ? 'direction-rtl' : ''}`}>
      
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
              <span className="mx-1">•</span>
              <span>
                {formatDistanceToNow(post.createdAt, { 
                  addSuffix: true,
                  locale: isRtl ? ar : undefined
                })}
              </span>
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
            </div>
          </div>
        </div>
      </div>

      <Link to={`/post/${post.id}`} className="block">
        <p className="text-sm whitespace-pre-wrap text-start p-3">{post.content}</p>
      </Link>

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
            
            // Optimistic update first
            const wasLiked = post.isLiked;
            post.isLiked = !wasLiked;
            post.likes = wasLiked ? Math.max(0, post.likes - 1) : post.likes + 1;
            
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
              post.isLiked = wasLiked;
              post.likes = wasLiked ? post.likes + 1 : Math.max(0, post.likes - 1);
              toast.error(isRtl ? 'حدث خطأ أثناء تحديث الإعجاب' : 'Error updating like status');
              console.error('Like error:', error);
            }
          }}
        >
          <Heart className="h-4 w-4" fill={post.isLiked ? "currentColor" : "none"} />
          <span>{post.likes}</span>
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
          onClick={() => onShare?.(post.id)}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

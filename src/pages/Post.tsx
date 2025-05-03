import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { PostDetail, Comment } from "@/components/ui-custom/PostDetail";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/types/supabase";
import { createPostNotification } from "@/services/notification.service";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type PostComment = Database["public"]["Tables"]["post_comments"]["Row"] & {
  profiles: Profile | null;
};

const Post = () => {
  const { postId } = useParams<{ postId: string }>();
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Function to update comments count in the database
  const updateCommentsCount = async (postId: string, count: number) => {
    try {
      const { error } = await supabase
        .from("posts")
        .update({ comments_count: count })
        .eq("id", postId);
        
      if (error) {
        console.error("Error updating comments count:", error);
      }
    } catch (error) {
      console.error("Error updating comments count:", error);
    }
  };
  
  useEffect(() => {
    const loadPost = async () => {
      setLoading(true);
      try {
        // Fetch post from Supabase
        const { data, error } = await supabase
          .from("posts")
          .select(`
            *,
            profiles:user_id (
              username,
              display_name,
              avatar_url
            )
          `)
          .eq("id", postId)
          .single();
          
        if (error) {
          console.error("Error fetching post:", error);
          return;
        }

        if (data) {
          // Transform the data to match our Post interface
          const profile = data.profiles || {};
          const foundPost = {
            id: data.id,
            content: data.content,
            images: data.media_urls || [], // Store all media URLs
            createdAt: new Date(data.created_at),
            created_at: data.created_at,
            likes: data.likes_count || 0,
            comments: data.comments_count || 0,
            user: {
              id: data.user_id,
              username: (profile as any).username || "unknown",
              displayName: (profile as any).display_name || "Unknown User",
              avatar: (profile as any).avatar_url || `https://i.pravatar.cc/150?u=${data.user_id}`
            }
          };
          
          setPost(foundPost);
          
          // Fetch comments for this post
          const { data: commentsData, error: commentsError } = await supabase
            .from("post_comments")
            .select(`
              *,
              profiles:user_id (
                username,
                display_name,
                avatar_url
              )
            `)
            .eq("post_id", postId)
            .order("created_at", { ascending: false });
            
          if (commentsError) {
            console.error("Error fetching comments:", commentsError);
            return;
          }
          
          // Get comment IDs
          const commentIds = commentsData.map(comment => comment.id);
          
          // Fetch existing likes for the current user
          const { data: existingLikes } = await supabase
            .from("comment_likes")
            .select("comment_id")
            .in("comment_id", commentIds)
            .eq("user_id", user?.id || "");
          
          // Create a set of liked comment IDs for faster lookup
          const likedCommentIds = new Set(existingLikes?.map(like => like.comment_id) || []);
          
          // Transform comments data
          const transformedComments = (commentsData as unknown as PostComment[]).map(comment => {
            const commentProfile = comment.profiles as Profile;
            return {
              id: comment.id,
              user: {
                id: comment.user_id,
                username: commentProfile?.username || "unknown",
                displayName: commentProfile?.display_name || "Unknown User",
                avatar: commentProfile?.avatar_url || `https://i.pravatar.cc/150?u=${comment.user_id}`
              },
              content: comment.content,
              createdAt: new Date(comment.created_at),
              likes: comment.likes_count || 0,
              isLiked: likedCommentIds.has(comment.id)
            };
          });
          
          setComments(transformedComments);
          
          // Check if comments count in the database matches the actual number of comments
          if (transformedComments.length !== foundPost.comments) {
            console.log(`Updating comments count from ${foundPost.comments} to ${transformedComments.length}`);
            updateCommentsCount(postId, transformedComments.length);
            
            // Update post state with the correct comments count
            setPost({
              ...foundPost,
              comments: transformedComments.length
            });
          }
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (postId) {
      loadPost();
    }
  }, [postId]);
  
  const handleCommentSubmit = async (commentText: string) => {
    if (!isAuthenticated) {
      toast.error("يرجى تسجيل الدخول للتعليق");
      return;
    }
    
    if (!commentText.trim()) {
      toast.error("يرجى كتابة تعليق");
      return;
    }
    
    try {
      // Create comment in Supabase
      const { data, error } = await supabase
        .from("post_comments")
        .insert({
          post_id: postId,
          user_id: user!.id,
          content: commentText,
          likes_count: 0
        })
        .select(`
          *,
          profiles:user_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .single();
        
      if (error) {
        throw error;
      }
      
      // Transform the new comment
      const profile = data.profiles || {};
      const newComment: Comment = {
        id: data.id,
        user: {
          id: data.user_id,
          username: (profile as any).username || "unknown",
          displayName: (profile as any).display_name || "Unknown User",
          avatar: (profile as any).avatar_url || `https://i.pravatar.cc/150?u=${data.user_id}`
        },
        content: data.content,
        createdAt: new Date(data.created_at),
        likes: 0,
        isLiked: false
      };
      
      // Update comments state
      setComments([newComment, ...comments]);
      
      // Update post comments count
      setPost({
        ...post,
        comments: post.comments + 1
      });
      
      // Update comments count in the database
      updateCommentsCount(postId, post.comments + 1);
      
      // Send notification to post owner if comment is not on the user's own post
      if (post.user.id !== user?.id) {
        try {
          await createPostNotification(
            post.user.id,
            user!.id,
            postId,
            "comment",
            user?.displayName || user?.username || "أحد المستخدمين"
          );
        } catch (notifyError) {
          console.error("Error sending comment notification:", notifyError);
          // Don't throw here - notification failure shouldn't stop comment functionality
        }
      }
      
      toast.success("تم إضافة التعليق");
    } catch (error) {
      console.error("Error creating comment:", error);
      toast.error("حدث خطأ أثناء إضافة التعليق");
    }
  };
  
  const handleLikeComment = async (commentId: string) => {
    if (!isAuthenticated || !user) {
      toast.error("Please sign in to like comments");
      return;
    }
    
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    try {
      // Check if user has already liked this comment
      const { data: existingLike } = await supabase
        .from("comment_likes")
        .select("id")
        .eq("comment_id", commentId)
        .eq("user_id", user.id)
        .single();

      if (existingLike) {
        // Unlike: Remove the like
        const { error } = await supabase
          .from("comment_likes")
          .delete()
          .eq("id", existingLike.id);

        if (error) throw error;

        // Update UI optimistically
        setComments(prevComments =>
          prevComments.map(c =>
            c.id === commentId
              ? { ...c, likes: c.likes - 1, isLiked: false }
              : c
          )
        );
      } else {
        // Like: Add new like
        const { error } = await supabase
          .from("comment_likes")
          .insert({
            comment_id: commentId,
            user_id: user.id
          });

        if (error) throw error;

        // Update UI optimistically
        setComments(prevComments =>
          prevComments.map(c =>
            c.id === commentId
              ? { ...c, likes: c.likes + 1, isLiked: true }
              : c
          )
        );
      }
    } catch (error) {
      console.error("Error updating comment like:", error);
      toast.error("Failed to update like status");
    }
  };
  
  const handlePostLike = async () => {
    if (!isAuthenticated) {
      toast.error("يرجى تسجيل الدخول للإعجاب بالمنشورات");
      return;
    }
    
    try {
      // Check if post is already liked
      const { data: existingLike, error: checkError } = await supabase
        .from("post_likes")
        .select()
        .eq("post_id", postId)
        .eq("user_id", user!.id)
        .maybeSingle();
        
      if (checkError) {
        throw checkError;
      }
      
      if (existingLike) {
        // Unlike the post
        const { error: unlikeError } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user!.id);
          
        if (unlikeError) {
          throw unlikeError;
        }
        
        // Update local state
        setPost({
          ...post,
          isLiked: false,
          likes: post.likes - 1
        });
      } else {
        // Like the post
        const { error: likeError } = await supabase
          .from("post_likes")
          .insert({
            post_id: postId,
            user_id: user!.id
          });
          
        if (likeError) {
          throw likeError;
        }
        
        // Update local state
        setPost({
          ...post,
          isLiked: true,
          likes: post.likes + 1
        });
        
        // Send notification to post owner if like is not on the user's own post
        if (post.user.id !== user?.id) {
          try {
            await createPostNotification(
              post.user.id,
              user!.id,
              postId,
              "like",
              user?.displayName || user?.username || "أحد المستخدمين"
            );
          } catch (notifyError) {
            console.error("Error sending like notification:", notifyError);
            // Don't throw here - notification failure shouldn't stop like functionality
          }
        }
      }
    } catch (error) {
      console.error("Error liking/unliking post:", error);
      toast.error("حدث خطأ أثناء تحديث الإعجاب");
    }
  };
  
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("تم نسخ الرابط إلى الحافظة");
  };

  if (!post && !loading) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold mb-4">لم يتم العثور على المنشور</h1>
          <p className="text-muted-foreground">المنشور غير موجود أو تم حذفه</p>
          <Link to="/" className="mt-6 inline-block text-primary hover:underline">
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PostDetail
        post={post}
        comments={comments}
        onCommentSubmit={handleCommentSubmit}
        onCommentLike={handleLikeComment}
        onPostLike={handlePostLike}
        onShare={handleShare}
        isLoading={loading}
      />
    </Layout>
  );
};

export default Post;

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PostCard } from "@/components/ui-custom/PostCard";
import { CreatePostForm } from "@/components/ui-custom/CreatePostForm";
import { ReelsSection } from "@/components/ui-custom/ReelsSection";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { usePosts, Post } from "@/hooks/use-posts";
import { useTranslation } from "@/hooks/use-translation";
import { useReels } from "@/hooks/use-reels";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { isAuthenticated } = useAuth();
  const { t, isRtl } = useTranslation();
  const { posts, isLoading, likePost } = usePosts();
  const [postsWithComments, setPostsWithComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [activeTab, setActiveTab] = useState("for-you");
  
  const handlePostCreated = () => {
    // Refresh posts after creating a new post
    // setPostsWithComments([]);
    // setLoadingComments(true);
  };

  // Fetch actual comment counts for each post
  useEffect(() => {
    const fetchCommentCounts = async () => {
      if (posts.length === 0) return;
      
      setLoadingComments(true);
      try {
        // Get all post IDs
        const postIds = posts.map(post => post.id);
        
        // Fetch comment counts for all posts
        const { data, error } = await supabase
          .from('post_comments')
          .select('post_id')
          .in('post_id', postIds);
          
        if (error) {
          console.error("Error fetching comment counts:", error);
          return;
        }
        
        // Create a map of post_id to comment count
        const commentCounts: Record<string, number> = {};
        postIds.forEach(id => {
          commentCounts[id] = 0;
        });
        
        // Update the map with actual counts
        if (data) {
          data.forEach((item: any) => {
            commentCounts[item.post_id] = (commentCounts[item.post_id] || 0) + 1;
          });
        }
        
        // Convert Post to PostWithUser with accurate comment counts
        const updatedPosts = posts.map(post => ({
          id: post.id,
          content: post.content,
          title: post.title || "",
          image: post.image_url,
          createdAt: new Date(post.created_at),
          user: {
            id: post.user_id,
            username: post.user?.username || "unknown",
            displayName: post.user?.display_name || "Unknown User",
            avatar: post.user?.avatar_url || "",
          },
          likes: post.likes_count || 0,
          comments: commentCounts[post.id] || 0,
          isLiked: false
        }));
        
        setPostsWithComments(updatedPosts);
      } catch (error) {
        console.error("Error in fetchCommentCounts:", error);
      } finally {
        setLoadingComments(false);
      }
    };
    
    if (!isLoading && posts.length > 0) {
      fetchCommentCounts();
    }
  }, [posts, isLoading]);

  // Use postsWithComments if available, otherwise use the original posts
  const displayPosts = postsWithComments.length > 0 ? postsWithComments : posts.map(post => ({
    id: post.id,
    content: post.content,
    title: post.title || "",
    image: post.image_url,
    createdAt: new Date(post.created_at),
    user: {
      id: post.user_id,
      username: post.user?.username || "unknown",
      displayName: post.user?.display_name || "Unknown User",
      avatar: post.user?.avatar_url || "",
    },
    likes: post.likes_count || 0,
    comments: post.comments_count || 0,
    isLiked: false
  }));

  return (
    <Layout>
      <div className={`max-w-4xl mx-auto ${isRtl ? 'rtl text-right' : 'ltr text-left'}`}>
        {/* Reels Section */}
        <div className="w-full overflow-hidden">
          <ReelsSection isActive={false} />
        </div>
        
        <Tabs defaultValue="for-you" className="w-full mb-8" onValueChange={setActiveTab}>
          <TabsList className={`w-full ${isRtl ? 'flex-row-reverse' : ''}`}>
            <TabsTrigger value="for-you" className="flex-1">{t('forYou')}</TabsTrigger>
            <TabsTrigger value="following" className="flex-1">{t('following')}</TabsTrigger>
            <TabsTrigger value="trending" className="flex-1">{t('trending')}</TabsTrigger>
          </TabsList>
          <TabsContent value="for-you" className="mt-0">
            {isAuthenticated && <CreatePostForm onPostCreated={handlePostCreated} />}
            
            {(isLoading || loadingComments) ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/6" />
                    </div>
                    <Skeleton className="h-48 w-full rounded-md" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {displayPosts.map((post) => (
                  <Link to={`/post/${post.id}`} key={post.id}>
                    <PostCard 
                      post={post} 
                      onLike={(id) => likePost(id)}
                    />
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="following" className="mt-0">
            <div className={`py-12 ${isRtl ? 'text-right' : 'text-center'}`}>
              <h3 className="text-lg font-medium mb-2">{t('noFollowing')}</h3>
              <p className="text-muted-foreground">{t('startFollowingPrompt')}</p>
            </div>
          </TabsContent>
          <TabsContent value="trending" className="mt-0">
            <div className="space-y-6">
              {displayPosts
                .sort((a, b) => b.likes - a.likes)
                .slice(0, 5)
                .map((post) => (
                  <Link to={`/post/${post.id}`} key={post.id}>
                    <PostCard 
                      post={post} 
                      onLike={(id) => likePost(id)}
                    />
                  </Link>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Index;

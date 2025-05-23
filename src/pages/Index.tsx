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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";



const Index = () => {
  const { isAuthenticated, user } = useAuth();
  const { t, isRtl } = useTranslation();
  const { posts, isLoading, getTopTags, getPostsByTag } = usePosts();
  const [postsWithComments, setPostsWithComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [activeTab, setActiveTab] = useState("for-you");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [topTags, setTopTags] = useState<string[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  
  const likePost = async (postId: string) => {
    if (!isAuthenticated || !user) return;
    
    try {
      const post = displayPosts.find(p => p.id === postId);
      if (!post) return;
      
      const wasLiked = post.isLiked;
      post.isLiked = !wasLiked;
      post.likes = wasLiked ? Math.max(0, post.likes - 1) : post.likes + 1;
      
      if (wasLiked) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
          
        if (error) throw error;
        toast.success(isRtl ? 'تم إزالة الإعجاب بنجاح' : 'Successfully unliked');
      } else {
        const { error } = await supabase
          .from('post_likes')
          .upsert(
            { 
              post_id: postId, 
              user_id: user.id,
              created_at: new Date().toISOString()
            },
            { onConflict: 'post_id,user_id' }
          );
          
        if (error) throw error;
        toast.success(isRtl ? 'تم تسجيل الإعجاب بنجاح' : 'Successfully liked');
      }
      
      // Refresh like count after update
      const { data: likeData } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);
      
      post.likes = likeData?.length || 0;
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error(isRtl ? 'حدث خطأ أثناء تحديث الإعجاب' : 'Error updating like status');
    }
  };
  
  const handlePostCreated = () => {
    // Refresh posts after creating a new post
    setPostsWithComments([]);
    setLoadingComments(true);
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
        
        // Fetch like counts for all posts
        const { data: likeCounts } = await supabase
          .from('post_likes')
          .select('post_id', { count: 'exact', head: false })
          .in('post_id', posts.map(p => p.id));
          
        const likeCountMap = new Map<string, number>();
        likeCounts?.forEach(item => {
          likeCountMap.set(item.post_id, (likeCountMap.get(item.post_id) || 0) + 1);
        });
        
        const updatedPosts = posts.map(async post => {
          // Fetch tags for this post
          const { data: postTags } = await supabase
            .from('posts_tags')
            .select(`
              tags (
                name
              )
            `)
            .eq('post_id', post.id);

          return {
            id: post.id,
            content: post.content,
            title: post.title || "",
            images: post.media_urls || [],
            createdAt: new Date(post.created_at),
            tags: postTags?.map(pt => pt.tags.name) || [],
            isLiked: likeCountMap.has(post.id),
            likes: likeCountMap.get(post.id) || 0,
            user: {
              id: post.user_id,
              username: post.user?.username || "unknown",
              displayName: post.user?.display_name || "Unknown User",
              avatar: post.user?.avatar_url || "",
            },
            comments: commentCounts[post.id] || 0
          };
        });
        
        const transformedPosts = await Promise.all(updatedPosts);
        setPostsWithComments(transformedPosts);
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
    image: post.media_urls || [], // Use first media URL if available
    createdAt: new Date(post.created_at),
    user: {
      id: post.user_id,
      username: post.user?.username || "unknown",
      displayName: post.user?.display_name || "Unknown User",
      avatar: post.user?.avatar_url || "",
    },
    comments: post.comments_count || 0
  }));

  useEffect(() => {
    // Load top tags
    getTopTags().then(tags => {
      setTopTags(tags.map(t => t.name));
    });
  }, []);

  // Filter posts by tag
  useEffect(() => {
    if (selectedTag) {
      getPostsByTag(selectedTag).then(filteredPosts => {
        setFilteredPosts(filteredPosts);
      });
    }
  }, [selectedTag]);

  return (
    <Layout>
      <div className={`max-w-4xl mx-auto ${isRtl ? 'rtl text-right' : 'ltr text-left'}`}>

        
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
                  <div key={i} className="border rounded-lg p-4 space-y-3" dir={isRtl ? "rtl" : "ltr"}>
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
                {(() => {
                  // Randomly intersperse reels between posts
                  const postsWithReels = [...displayPosts];
                  const reelFrequency = Math.max(3, Math.floor(postsWithReels.length / 3));
                  
                  for (let i = reelFrequency; i < postsWithReels.length; i += reelFrequency + 1) {
                    postsWithReels.splice(i, 0, { isReel: true });
                  }
                  
                  return postsWithReels.map((item, index) => {
                    if (item.isReel) {
                      return (
                        <div key={`reel-${index}`} className="mb-6">
                          <ReelsSection isActive={false} key={`reels-${Math.random()}`} />
                        </div>
                      );
                    }
                    return (
                      <div key={item.id} className="mb-6">
                        <PostCard 
                          post={item}
                          onLike={likePost}
                        />
                      </div>
                    );
                  });
                })()}
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
                  <PostCard 
                    key={post.id}
                    post={post}
                    onLike={likePost}
                  />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Index;

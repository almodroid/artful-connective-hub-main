import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { PostCard } from "@/components/ui-custom/PostCard";
import { Badge } from "@/components/ui/badge";
import { useParams, useNavigate } from "react-router-dom";
import { usePosts } from "@/hooks/use-posts";
import { useTranslation } from "@/hooks/use-translation";
import { formatTagForDisplay } from '@/utils/tag-utils';
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const TagPage = () => {
  const { tag } = useParams();
  const navigate = useNavigate();
  const { t, isRtl } = useTranslation();
  const { likePost } = usePosts();
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTagPosts = async () => {
      if (!tag) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // First get the tag ID from tags table
        const { data: tagData, error: tagError } = await supabase
          .from('tags')
          .select('id')
          .eq('name', tag)
          .single();

        if (tagError) throw tagError;
        if (!tagData) {
          setPosts([]);
          return;
        }

        // Then get post IDs from posts_tags using the tag ID
        const { data: tagPosts, error: postsTagsError } = await supabase
          .from('posts_tags')
          .select('post_id')
          .eq('tag_id', tagData.id);

        if (postsTagsError) throw postsTagsError;
        if (!tagPosts?.length) {
          setPosts([]);
          return;
        }

        // Get the actual posts using the post IDs
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            id,
            content,
            media_urls,
            created_at,
            user_id,
            comments_count,
            profiles (
              username,
              display_name,
              avatar_url
            )
          `)
          .in('id', tagPosts.map(tp => tp.post_id));

        if (postsError) throw postsError;

        // Get likes count for each post
        const { data: likesData, error: likesError } = await supabase
          .from('post_likes')
          .select('post_id', { count: 'exact' })
          .in('post_id', tagPosts.map(tp => tp.post_id));

        if (likesError) throw likesError;

        // Create a map of post_id to likes count
        const likesMap = new Map<string, number>();
        likesData?.forEach(item => {
          likesMap.set(item.post_id, (likesMap.get(item.post_id) || 0) + 1);
        });

        // Transform the data
        const transformedPosts = postsData.map(post => ({
          id: post.id,
          content: post.content,
          images: post.media_urls || [],
          createdAt: new Date(post.created_at),
          user: {
            id: post.user_id,
            username: post.profiles?.username || "unknown",
            displayName: post.profiles?.display_name || "Unknown User",
            avatar: post.profiles?.avatar_url || "",
          },
          likes: likesMap.get(post.id) || 0,
          comments: post.comments_count || 0,
          isLiked: false
        }));

        setPosts(transformedPosts);
      } catch (err) {
        console.error("Error fetching tag posts:", err);
        setError(isRtl ? "حدث خطأ أثناء جلب المنشورات" : "Error fetching posts");
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTagPosts();
  }, [tag, isRtl]);

  const handleBack = () => {
    navigate('/explore');
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
            <Badge variant="secondary" className="px-3 py-1">
              #{formatTagForDisplay(tag || '')}
            </Badge>
          </div>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>{t("loading")}</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive">{error}</p>
            </div>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post}
                onLike={(id) => likePost(id)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {t("noPostsWithTag")} #{formatTagForDisplay(tag || '')}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TagPage; 
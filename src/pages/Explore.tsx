import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { PostCard } from "@/components/ui-custom/PostCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, TrendingUp, Hash } from "lucide-react";
import { usePosts, Post } from "@/hooks/use-posts";
import { useTranslation } from "@/hooks/use-translation";
import { formatTag, formatTagForDisplay } from '@/utils/tag-utils';
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "react-hot-toast";

interface Tag {
  name: string;
  count: number;
}

const Explore = () => {
  const { posts, isLoading, likePost, getPostsByTag } = usePosts();
  const { t, isRtl } = useTranslation();
  const navigate = useNavigate();
  const { tag: urlTag } = useParams();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(urlTag ? "hashtags" : "all");
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [topTags, setTopTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(urlTag || null);
  const [loadingTags, setLoadingTags] = useState(true);
  const [tagPosts, setTagPosts] = useState<{
    id: string;
    content: string;
    images: string[];
    createdAt: Date;
    user: {
      id: string;
      username: string;
      displayName: string;
      avatar: string;
    };
    likes: number;
    comments: number;
    isLiked: boolean;
    tags: string[];
  }[]>([]);
  const [postsWithUser, setPostsWithUser] = useState<any[]>([]);

  // Fetch top tags with post counts
  useEffect(() => {
    const fetchTopTags = async () => {
      try {
        const { data, error } = await supabase
          .from("tags")
          .select(`
            name,
            posts_tags (
              post_id
            )
          `)
          .eq("type", "post");

        if (error) throw error;

        // Calculate tag counts and sort by usage
        const tagCounts = data.map(tag => ({
          name: tag.name,
          count: tag.posts_tags?.length || 0
        })).sort((a, b) => b.count - a.count);

        setTopTags(tagCounts);
      } catch (error) {
        console.error("Error fetching top tags:", error);
      } finally {
        setLoadingTags(false);
      }
    };

    fetchTopTags();
  }, []);

  // Add this function to sort posts by tag usage
  const sortPostsByTagUsage = (posts: Post[]) => {
    return [...posts].sort((a, b) => {
      const aTagCount = a.tags?.length || 0;
      const bTagCount = b.tags?.length || 0;
      return bTagCount - aTagCount;
    });
  };

  // Update the useEffect for filtering posts
  useEffect(() => {
    if (!posts) return;
    
    let result = [...posts];
    
    // Filter by search term
    if (searchTerm) {
      result = result.filter(post => 
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.user?.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (post.user?.display_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Filter by selected tag
    if (selectedTag) {
      result = result.filter(post => 
        post.tags?.includes(selectedTag)
      );
    }
    
    // Additional filtering by tab
    switch (activeTab) {
      case "trending":
        // Sort by tag usage and likes
        result = sortPostsByTagUsage(result);
        result.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
        break;
      default:
        // No additional filtering for "all" and "hashtags"
        break;
    }
    
    setFilteredPosts(result);
  }, [posts, searchTerm, activeTab, selectedTag]);

  // Update the handleTagClick function to fetch tags
  const handleTagClick = async (tag: string) => {
    const formattedTag = formatTag(tag);
    setSelectedTag(formattedTag);
    setActiveTab("hashtags");
    
    try {
      const posts = await getPostsByTag(formattedTag);
      const transformedPosts = await Promise.all(posts.map(async post => {
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
          images: post.media_urls || [],
          createdAt: new Date(post.created_at),
          tags: postTags?.map(pt => pt.tags.name) || [],
          user: {
            id: post.user_id,
            username: post.profiles?.username || "unknown",
            displayName: post.profiles?.display_name || "Unknown User",
            avatar: post.profiles?.avatar_url || "",
          },
          likes: post.likes_count || 0,
          comments: post.comments_count || 0,
          isLiked: false
        };
      }));
      setTagPosts(transformedPosts);
    } catch (error) {
      console.error("Error fetching tag posts:", error);
      toast.error(isRtl ? "حدث خطأ أثناء جلب المنشورات" : "Error fetching posts");
    }
  };

  // Update the clearTagSelection function to also clear tag posts
  const clearTagSelection = () => {
    setSelectedTag(null);
    setTagPosts([]);
    navigate('/explore');
  };
  
  // Add this useEffect to handle the transformation
  useEffect(() => {
    const transformPosts = async () => {
      const transformed = await Promise.all(filteredPosts.map(async post => {
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
          images: post.media_urls || [],
          createdAt: new Date(post.created_at),
          tags: postTags?.map(pt => pt.tags.name) || [],
          user: {
            id: post.user_id,
            username: post.user?.username || "unknown",
            displayName: post.user?.display_name || "Unknown User",
            avatar: post.user?.avatar_url || "",
          },
          likes: post.likes_count || 0,
          comments: post.comments_count || 0,
          isLiked: false
        };
      }));
      setPostsWithUser(transformed);
    };

    transformPosts();
  }, [filteredPosts]);

  // Update the handleTabChange function to clear tag posts when switching to "all" or "trending"
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "all" || value === "trending") {
      setSelectedTag(null);
      setTagPosts([]);
      navigate('/explore');
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
              dir={isRtl ? "rtl" : "ltr"}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="w-full">
              <TabsTrigger value="all">
                <Hash className="h-4 w-4 mr-2" />
                {t("all")}
              </TabsTrigger>
              <TabsTrigger value="hashtags">
                <Hash className="h-4 w-4 mr-2" />
                {t("hashtags")}
              </TabsTrigger>
              <TabsTrigger value="trending">
                <TrendingUp className="h-4 w-4 mr-2" />
                {t("trending")}
              </TabsTrigger>
            </TabsList>
            
            {/* Selected Tag Display */}
            {selectedTag && (
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1">
                  #{formatTagForDisplay(selectedTag)}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearTagSelection}
                  className="h-6 px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* Tags Content */}
            <TabsContent value="hashtags" className="mt-4">
              {loadingTags ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {topTags.map((tag) => (
                    <Badge
                      key={tag.name}
                      variant={selectedTag === tag.name ? "default" : "outline"}
                      className="cursor-pointer hover:bg-secondary"
                      onClick={() => handleTagClick(tag.name)}
                    >
                      #{formatTagForDisplay(tag.name)}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({tag.count})
                      </span>
                    </Badge>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Trending Content */}
            <TabsContent value="trending" className="mt-4">
              {loadingTags ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {topTags.slice(0, 10).map((tag) => (
                    <Badge
                      key={tag.name}
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary"
                      onClick={() => navigate(`/explore/tag/${formatTag(tag.name)}`)}
                    >
                      #{formatTagForDisplay(tag.name)}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({tag.count})
                      </span>
                    </Badge>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Posts List */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>{t("loading")}</p>
            </div>
          ) : (selectedTag ? tagPosts : postsWithUser).length > 0 ? (
            (selectedTag ? tagPosts : postsWithUser).map((post) => (
              <PostCard 
                key={post.id} 
                post={post}
                onLike={(id) => likePost(id)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {selectedTag 
                  ? `${t("noPostsWithTag")} #${formatTagForDisplay(selectedTag)}`
                  : t("noResults")}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Explore;

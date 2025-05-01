
import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { PostCard } from "@/components/ui-custom/PostCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { usePosts, Post } from "@/hooks/use-posts";
import { useTranslation } from "@/hooks/use-translation";

const Explore = () => {
  const { posts, isLoading, likePost } = usePosts();
  const { t, isRtl } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  
  // Extract hashtags and mentions from posts (mocked for now)
  const extractTags = (posts: Post[]) => {
    // Mock implementation for hashtags and mentions
    return {
      hashtags: ["art", "design", "painting", "digital", "traditional"],
      mentions: ["@ahmed", "@sara", "@mohammed", "@fatima", "@ali"]
    };
  };
  
  const { hashtags, mentions } = extractTags(posts);
  
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
    
    // Additional filtering by tab
    switch (activeTab) {
      case "hashtags":
        // In a real app, filter by hashtags
        break;
      case "mentions":
        // In a real app, filter by mentions
        break;
      case "trending":
        // Sort by popularity (likes)
        result.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
        break;
      default:
        // No additional filtering for "all"
        break;
    }
    
    setFilteredPosts(result);
  }, [posts, searchTerm, activeTab]);
  
  // Convert Post to PostWithUser
  const postsWithUser = filteredPosts.map(post => ({
    id: post.id,
    content: post.content,
    title: post.title || "",
    image_url: post.image_url,
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
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
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
          
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="all">{t("all")}</TabsTrigger>
              <TabsTrigger value="hashtags">{t("hashtags")}</TabsTrigger>
              <TabsTrigger value="mentions">{t("mentions")}</TabsTrigger>
              <TabsTrigger value="trending">{t("trending")}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="hashtags" className="mt-4">
              <div className="flex flex-wrap gap-2 mb-6">
                {hashtags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="mentions" className="mt-4">
              <div className="flex flex-wrap gap-2 mb-6">
                {mentions.map((mention) => (
                  <Badge key={mention} variant="secondary" className="cursor-pointer">
                    {mention}
                  </Badge>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Show search results */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>{t("loading")}</p>
            </div>
          ) : postsWithUser.length > 0 ? (
            postsWithUser.map((post) => (
              <PostCard 
                key={post.id} 
                post={post}
                onLike={(id) => likePost(id)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("noResults")}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Explore;

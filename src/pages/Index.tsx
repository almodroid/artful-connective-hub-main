import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PostCard, Post as PostCardType } from "@/components/ui-custom/PostCard";
import { ProjectCard, Project as ProjectCardUI } from "@/components/ui-custom/ProjectCard";
import { CreatePostForm } from "@/components/ui-custom/CreatePostForm";
import { Project } from "@/types/project.types";

import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePosts, Post as DatabasePost } from "@/hooks/use-posts";
import { useTranslation } from "@/hooks/use-translation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";
import { GoogleAd } from '@/components/ui-custom/GoogleAd';
import { useSettings } from '@/hooks/use-settings';

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type SupabasePost = Database["public"]["Tables"]["posts"]["Row"] & {
  profiles: Profile | null;
};
type SupabaseProject = Database["public"]["Tables"]["projects"]["Row"] & {
  profiles: Profile | null;
};

const Index = () => {
  const { isAuthenticated, user } = useAuth();
  const { t, isRtl } = useTranslation();
  const { posts, getTopTags, getPostsByTag } = usePosts();
  const [activeTab, setActiveTab] = useState("for-you");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [topTags, setTopTags] = useState<string[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<DatabasePost[]>([]);
  const [followingPosts, setFollowingPosts] = useState<PostCardType[]>([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [topProjectsPosts, setTopProjectsPosts] = useState<ProjectCardUI[]>([]);
  const [loadingTopProjects, setLoadingTopProjects] = useState(false);
  const { adsSettings, loading: adsLoading } = useSettings();

  const likePost = async (id: string, type: 'post' | 'project') => {
    if (!isAuthenticated || !user) return;

    try {
      let item: PostCardType | ProjectCardUI | undefined;
      if (type === 'post') {
        item = forYouPosts.find(p => p.id === id) || followingPosts.find(p => p.id === id);
      } else {
        item = topProjectsPosts.find(p => p.id === id);
      }

      if (!item) return;

      const wasLiked = item.isLiked;
      item.isLiked = !wasLiked;
      item.likes = wasLiked ? Math.max(0, item.likes - 1) : item.likes + 1;

      const tableName = type === 'post' ? 'post_likes' : 'project_likes';
      const idColumn = type === 'post' ? 'post_id' : 'project_id';

      if (wasLiked) {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq(idColumn, id)
          .eq('user_id', user.id);
        if (error) {
          toast.error(isRtl ? 'حدث خطأ أثناء تحديث الإعجاب' : 'Error updating like status');
          return;
        }
        toast.success(isRtl ? 'تم إزالة الإعجاب بنجاح' : 'Successfully unliked');
      } else {
        const { error } = await supabase
          .from(tableName)
          .upsert(
            { [idColumn]: id, user_id: user.id, created_at: new Date().toISOString() },
            { onConflict: `${idColumn},user_id` }
          );
        if (error) {
          toast.error(isRtl ? 'حدث خطأ أثناء تحديث الإعجاب' : 'Error updating like status');
          return;
        }
        toast.success(isRtl ? 'تم تسجيل الإعجاب بنجاح' : 'Successfully liked');
      }

      // Refresh like count after update
      const { data: likeData } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .eq(idColumn, id);
      item.likes = likeData?.length || 0;
    } catch {
      toast.error(isRtl ? 'حدث خطأ أثناء تحديث الإعجاب' : 'Error updating like status');
    }
  };

  const handlePostCreated = () => {
    // Refresh posts after creating a new post
    setForYouPosts([]);
    setLoadingForYou(true);
  };

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

  const [forYouPosts, setForYouPosts] = useState<PostCardType[]>([]);
  const [loadingForYou, setLoadingForYou] = useState(false);

  // Fetch for-you posts when tab changes to for-you
  useEffect(() => {
    const fetchForYouPosts = async () => {
      if (activeTab !== 'for-you') return;

      setLoadingForYou(true);
      try {
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            *,
            profiles:user_id (
              username,
              display_name,
              avatar_url
            )
          `)
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        const transformedPosts = await Promise.all((postsData as SupabasePost[]).map(async post => {
          const { count: commentCount } = await supabase
            .from('post_comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          const { data: likeData } = await supabase
            .from('post_likes')
            .select('*', { count: 'exact', head: false })
            .eq('post_id', post.id);

          const isLiked = likeData?.some(like => like.user_id === user?.id) || false;

          return {
            id: post.id,
            content: post.content,
            title: post.title || "",
            images: post.media_urls || [],
            createdAt: new Date(post.created_at || ""),
            user: {
              id: post.user_id,
              username: post.profiles?.username || "unknown",
              displayName: post.profiles?.display_name || "Unknown User",
              avatar: post.profiles?.avatar_url || "",
            },
            comments: commentCount || 0,
            likes: likeData?.length || 0,
            isLiked
          };
        }));

        setForYouPosts(transformedPosts);
      } catch (error) {
        console.error('Error fetching for-you posts:', error);
        toast.error(isRtl ? 'حدث خطأ أثناء جلب المنشورات' : 'Error fetching posts');
      } finally {
        setLoadingForYou(false);
      }
    };

    fetchForYouPosts();
  }, [activeTab, isAuthenticated, user]);

  // Fetch trends posts when tab changes to trends
  useEffect(() => {
    const fetchTrendsPosts = async () => {
      if (activeTab !== 'trends') return;

      setLoadingFollowing(true);
      try {
        // Fetch posts ordered by creation date (for trends)
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            *,
            profiles:user_id (
              username,
              display_name,
              avatar_url
            )
          `)
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        // Transform posts to match the PostCard type
        const transformedPosts = await Promise.all((postsData as SupabasePost[]).map(async post => {
          // Get comment count
          const { count: commentCount } = await supabase
            .from('post_comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          // Get like count and check if current user liked
          const { data: likeData } = await supabase
            .from('post_likes')
            .select('*', { count: 'exact', head: false })
            .eq('post_id', post.id);

          const isLiked = likeData?.some(like => like.user_id === user?.id) || false;

          return {
            id: post.id,
            content: post.content,
            title: post.title || "",
            images: post.media_urls || [],
            createdAt: new Date(post.created_at || ""),
            user: {
              id: post.user_id,
              username: post.profiles?.username || "unknown",
              displayName: post.profiles?.display_name || "Unknown User",
              avatar: post.profiles?.avatar_url || "",
            },
            comments: commentCount || 0,
            likes: likeData?.length || 0,
            isLiked
          };
        }));

        setFollowingPosts(transformedPosts);
      } catch (error) {
        console.error('Error fetching trends posts:', error);
        toast.error(isRtl ? 'حدث خطأ أثناء جلب المنشورات' : 'Error fetching posts');
      } finally {
        setLoadingFollowing(false);
      }
    };

    fetchTrendsPosts();
  }, [activeTab, isAuthenticated, user]);

  // Fetch top projects posts when tab changes to top-projects
  useEffect(() => {
    const fetchTopProjectsPosts = async () => {
      if (activeTab !== 'top-projects') return;

      setLoadingTopProjects(true);
      try {
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select(`
            *,
            profiles:user_id (
              username,
              display_name,
              avatar_url
            )
          `);

        if (projectsError) throw projectsError;

        const transformedProjects = await Promise.all((projectsData as unknown as SupabaseProject[]).map(async project => {
          const { count: commentCount } = await supabase
            .from('project_comments')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);

          const { data: likeData } = await supabase
            .from('project_likes')
            .select('*', { count: 'exact', head: false })
            .eq('project_id', project.id);

          const isLiked = likeData?.some(like => like.user_id === user?.id) || false;

          return {
            id: project.id,
            title: project.title || "",
            description: project.description || "",
            thumbnail_url: project.image_urls?.[0] || "",
            project_url: project.external_link || undefined,
            github_url: undefined,
            technologies: project.tags || [],
            createdAt: new Date(project.created_at || ""),
            user: {
              id: project.user_id,
              username: project.profiles?.username || "unknown",
              displayName: project.profiles?.display_name || "Unknown User",
              avatar: project.profiles?.avatar_url || "",
            },
            comments: commentCount || 0,
            likes: likeData?.length || 0,
            isLiked
          };
        }));

        // Sort projects by likes in descending order
        transformedProjects.sort((a, b) => b.likes - a.likes);

        setTopProjectsPosts(transformedProjects);
      } catch (error) {
        console.error('Error fetching top projects posts:', error);
        toast.error(isRtl ? 'حدث خطأ أثناء جلب المشاريع المميزة' : 'Error fetching top projects');
      } finally {
        setLoadingTopProjects(false);
      }
    };

    fetchTopProjectsPosts();
  }, [activeTab, isAuthenticated, user]);

  return (
    <Layout>
      <div className={`max-w-4xl mx-auto px-2 sm:px-4  ${isRtl ? 'rtl text-right' : 'ltr text-left'}`}>


        <Tabs value={activeTab} className="w-full mb-8" onValueChange={setActiveTab}>
          {/* Mobile View: Select */}
          <div className="md:hidden mb-6">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full" dir={isRtl ? "rtl" : "ltr"}>
                <SelectValue placeholder={t('selectView')} />
              </SelectTrigger>
              <SelectContent dir={isRtl ? "rtl" : "ltr"}>
                <SelectItem value="for-you">{t('forYou')}</SelectItem>
                <SelectItem value="trends">{t('trends')}</SelectItem>
                <SelectItem value="top-projects">{t('topProjects')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop View: TabsList */}
          <TabsList className={`hidden md:flex w-full ${isRtl ? 'flex-row-reverse' : ''} ${!isAuthenticated ? 'mb-8' : ''}`}>
            <TabsTrigger value="for-you" className="flex-1">{t('forYou')}</TabsTrigger>
            <TabsTrigger value="trends" className="flex-1">{t('trends')}</TabsTrigger>
            <TabsTrigger value="top-projects" className="flex-1">{t('topProjects')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="for-you" className="mt-0">
            {isAuthenticated && <CreatePostForm onPostCreated={handlePostCreated} />}

            {!adsLoading && adsSettings?.homepage_feed && (
              <div className="my-4">
                <GoogleAd adSlotId={adsSettings.homepage_feed} publisherId={adsSettings.adsense_publisher_id} />
              </div>
            )}
            {loadingForYou ? (
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
            ) : forYouPosts.length > 0 ? (
              <div className="space-y-6">
                {forYouPosts.map((post, index) => (
                  <>
                    <PostCard
                      key={post.id}
                      post={post}
                      onLike={(id) => likePost(id, 'post')}
                    />
                    {adsSettings?.homepage_feed && index > 0 && (index + 1) % 3 === 0 && (
                      <div className="my-4">
                        <GoogleAd adSlotId={adsSettings.homepage_feed} publisherId={adsSettings.adsense_publisher_id} />
                      </div>
                    )}
                  </>
                ))}
              </div>
            ) : (
              <div className={`py-12 ${isRtl ? 'text-right' : 'text-center'}`}>
                <h3 className="text-lg font-medium mb-2">{t('noPosts')}</h3>
                <p className="text-muted-foreground">{t('noPostsPrompt')}</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="trends" className="mt-0">
            {loadingFollowing ? (
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
            ) : followingPosts.length > 0 ? (
              <div className="space-y-6">
                {followingPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={(id) => likePost(id, 'post')}
                  />
                ))}
              </div>
            ) : (
              <div className={`py-12 ${isRtl ? 'text-right' : 'text-center'}`}>
                <h3 className="text-lg font-medium mb-2">{t('noTrends')}</h3>
                <p className="text-muted-foreground">{t('noTrendsPrompt')}</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="top-projects" className="mt-0" dir={isRtl ? "rtl" : "ltr"}>
            {loadingTopProjects ? (
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
            ) : topProjectsPosts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topProjectsPosts.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onLike={(id) => likePost(id, 'project')}
                  />
                ))}
              </div>
            ) : (
              <div className={`py-12 ${isRtl ? 'text-right' : 'text-center'}`}>
                <h3 className="text-lg font-medium mb-2">{t('noTopProjects')}</h3>
                <p className="text-muted-foreground">{t('noTopProjectsPrompt')}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Index;

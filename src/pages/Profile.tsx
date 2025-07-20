import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PostCard, Post } from "@/components/ui-custom/PostCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { Edit, Film, Image, Link2, MapPin, MessageSquare, Plus, Users, Eye, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreateReelDialog } from "@/components/ui-custom/CreateReelDialog";
import { ReelWithUser, useReels } from "@/hooks/use-reels";
import { useTranslation } from "@/hooks/use-translation";
import { ReelCard } from "@/components/ui-custom/ReelCard";
import { FollowListModal } from "@/components/ui-custom/FollowListModal";
import { fetchProjectsByUserId, ProjectWithUser } from "@/services/project.service";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";


interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  header_image?: string;
  bio?: string;
  location?: string;
  website?: string;
  followers?: number;
  following?: number;
  joinDate?: string;
  is_admin?: boolean;
  created_at?: string;
  allow_messages?: boolean;
}

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userReels, setUserReels] = useState<ReelWithUser[]>([]);
  const [userLikedPosts, setUserLikedPosts] = useState<Post[]>([]);
  const [userMediaPosts, setUserMediaPosts] = useState<Post[]>([]);
  const [userProjects, setUserProjects] = useState<ProjectWithUser[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [loadingTab, setLoadingTab] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCreateReelOpen, setIsCreateReelOpen] = useState(false);
  const { t, isRtl } = useTranslation();
  const { reels, isLoading: reelsLoading, viewReel, likeReel } = useReels();
  
  const isOwnProfile = isAuthenticated && user?.username === username;
  
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);``
      try {
        // Fetch profile from Supabase
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(`
            *,
            followers_count,
            following_count,
            followers!followers_following_id_fkey (
              follower:profiles!followers_follower_id_fkey (
                id,
                username,
                display_name,
                avatar_url
              )
            )
          `)
          .eq("username", username)
          .single();
        
        if (profileError) {
          console.error("Error fetching profile:", profileError);
          // If we can't find by username, try to use fallback mock data (for backward compatibility)
          if (username === "admin" || username === "user") {
            // Mock profile data for demo purposes
            if (username === "admin") {
              setProfileUser({
                id: "1",
                username: "admin",
                display_name: "مدير النظام",
                avatar_url: "/avatar-1.png",
                bio: "مصمم ومطور ويب مهتم بالفنون البصرية والتصميم التفاعلي، مدير النظام في آرت سبيس.",
                location: "الرياض، المملكة العربية السعودية",
                website: "https://example.com",
                followers: 1205,
                following: 321,
                joinDate: "يناير 2023"
              });
            } else if (username === "user") {
              setProfileUser({
                id: "2",
                username: "user",
                display_name: "مستخدم عادي",
                avatar_url: "/avatar-2.png",
                bio: "رسام ومصور فوتوغرافي. أحب التقاط لحظات الحياة اليومية وتحويلها إلى فن.",
                location: "دبي، الإمارات العربية المتحدة",
                website: "https://myportfolio.com",
                followers: 452,
                following: 189,
                joinDate: "مارس 2023"
              });
            }
          } else {
            throw profileError;
          }
        } else {
          // Transform Supabase profile data to our UserProfile format
          setProfileUser({
            id: profileData.id,
            username: profileData.username,
            display_name: profileData.display_name,
            avatar_url: profileData.avatar_url,
            header_image: (profileData as any).header_image,
            bio: profileData.bio,
            location: profileData.location,
            website: profileData.website,
            followers: profileData.followers?.length || 0,
            following: profileData.following_count || 0,
            joinDate: new Date(profileData.created_at).toLocaleDateString('ar-SA', {
              year: 'numeric',
              month: 'long'
            }),
            created_at: profileData.created_at,
            allow_messages: profileData.allow_messages
          });

          // Check if the current user is following this profile
          if (isAuthenticated && user) {
            const { data: isFollowingData } = await supabase
              .rpc('is_following', {
                follower_id: user.id,
                following_id: profileData.id
              });
            setIsFollowing(isFollowingData);
          }
        }
        
        // Fetch posts for this user
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select(`
            *,
            profiles:user_id (
              username,
              display_name,
              avatar_url
            )
          `)
          .eq("user_id", profileData?.id || "")
          .order("created_at", { ascending: false });
        
        if (postsError) {
          console.error("Error fetching posts:", postsError);
          // Fallback to mock posts if needed
          setUserPosts([]);
        } else {
          // Transform the posts data to match our Post interface
          const transformedPosts = postsData.map(post => {
            const profile = post.profiles || {};
            return {
              id: post.id,
              content: post.content,
              image: Array.isArray(post.media_urls) ? post.media_urls[0] : post.media_urls,
              createdAt: new Date(post.created_at),
              likes: post.likes_count || 0,
              comments: post.comments_count || 0,
              isLiked: false,
              user: {
                id: post.user_id,
                username: (profile as any).username || "",
                displayName: (profile as any).display_name || "",
                avatar: (profile as any).avatar_url || `https://i.pravatar.cc/150?u=${post.user_id}`
              }
            };
          });
          
          setUserPosts(transformedPosts);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("حدث خطأ أثناء تحميل الملف الشخصي");
        setProfileUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    if (username) {
      loadProfile();
    }
  }, [username, isAuthenticated, user]);
  
  const handleFollow = async () => {
    if (!isAuthenticated || !user || !profileUser) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profileUser.id);

        if (error) throw error;
        setIsFollowing(false);
        
        // Refresh profile data to get updated counts
        const { data: updatedProfile, error: refreshError } = await supabase
          .from("profiles")
          .select(`
            *,
            followers_count,
            following_count
          `)
          .eq("username", username)
          .single();
          
        if (refreshError) {
          console.error("Error refreshing profile:", refreshError);
        } else if (updatedProfile) {
          setProfileUser(prev => prev ? {
            ...prev,
            followers: updatedProfile.followers_count || 0,
            following: updatedProfile.following_count || 0
          } : null);
        }
        
        toast.success("تم إلغاء المتابعة بنجاح");
      } else {
        // Follow
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: user.id,
            following_id: profileUser.id
          });

        if (error) throw error;
        setIsFollowing(true);
        
        // Refresh profile data to get updated counts
        const { data: updatedProfile, error: refreshError } = await supabase
          .from("profiles")
          .select(`
            *,
            followers_count,
            following_count
          `)
          .eq("username", username)
          .single();
          
        if (refreshError) {
          console.error("Error refreshing profile:", refreshError);
        } else if (updatedProfile) {
          setProfileUser(prev => prev ? {
            ...prev,
            followers: updatedProfile.followers_count || 0,
            following: updatedProfile.following_count || 0
          } : null);
        }
        
        toast.success("تم المتابعة بنجاح");
      }
    } catch (error) {
      console.error("Error following/unfollowing:", error);
      toast.error("حدث خطأ أثناء تحديث حالة المتابعة");
    }
  };

  // Function to load data for the active tab
  const loadTabData = async (tab: string) => {
    if (!profileUser) return;
    
    if (tab === 'projects') {
      setLoadingProjects(true);
    } else {
      setLoadingTab(true);
    }
    
    try {
      switch (tab) {
        case "posts":
          // Posts are already loaded in loadProfile, or can be re-fetched if needed
          break;
          
        case "reels":
          // Reels are handled by the useReels hook, filtering happens in JSX
          break;
          
        case "media":
          // Filter posts with media
          setUserMediaPosts(userPosts.filter(post => post.image).map(post => ({ ...post, isLiked: post.isLiked ?? false })));
          break;
          
        case "likes":
          // Fetch liked posts
          const { data: likedPostsData, error: likedPostsError } = await supabase
            .from("post_likes")
            .select(`
              post_id,
              posts!inner (
                id,
                content,
                media_urls,
                created_at,
                likes_count,
                comments_count,
                user_id,
                profiles:user_id (
                  username,
                  display_name,
                  avatar_url
                )
              )
            `)
            .eq("user_id", profileUser.id)
            .order("created_at", { ascending: false });
            
          if (likedPostsError) {
            console.error("Error fetching liked posts:", likedPostsError);
            toast.error(isRtl ? "حدث خطأ أثناء تحميل المنشورات المعجبة بها" : "Error loading liked posts");
            return;
          }
          
          // Transform the liked posts data
          const transformedLikedPosts = likedPostsData
            .filter(item => item.posts) // Filter out any null posts
            .map(item => {
              const post = item.posts as any;
              const profile = post.profiles || {};
              return {
                id: post.id,
                content: post.content,
                image: Array.isArray(post.media_urls) ? post.media_urls[0] : post.media_urls,
                createdAt: new Date(post.created_at),
                likes: post.likes_count || 0,
                comments: post.comments_count || 0,
                isLiked: true,
                user: {
                  id: post.user_id,
                  username: (profile as any).username || "",
                  displayName: (profile as any).display_name || "",
                  avatar: (profile as any).avatar_url || `https://i.pravatar.cc/150?u=${post.user_id}`
                }
              };
            });
            
          setUserLikedPosts(transformedLikedPosts);
          break;
          
        case "projects":
          // Fetch user's projects
          const projectsData = await fetchProjectsByUserId(profileUser.id);
          setUserProjects(projectsData);
          break;
      }
    } catch (error) {
      console.error(`Error loading ${tab} data:`, error);
      toast.error(isRtl ? `حدث خطأ أثناء تحميل ${tab}` : `Error loading ${tab}`);
    } finally {
      if (tab === 'projects') {
        setLoadingProjects(false);
      } else {
        setLoadingTab(false);
      }
    }
  };
  
  // Load tab data when tab changes
  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab, profileUser]);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Skeleton className="h-32 w-32 rounded-full" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full" />
                <div className="flex gap-4">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </div>
            
            <Skeleton className="h-12 w-full" />
            
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
                  </div>
                  <Skeleton className="h-48 w-full rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!profileUser) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold mb-4">لم يتم العثور على المستخدم</h1>
          <p className="text-muted-foreground">المستخدم غير موجود أو تم حذفه</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        {/* Profile Header */}
        <div className="rounded-xl overflow-hidden bg-muted/10 mb-8">
          <div className="h-48 bg-gradient-to-r from-primary/10 to-primary/30 relative overflow-hidden">
            {profileUser?.header_image && (
              <img 
                src={profileUser.header_image} 
                alt="Header" 
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-opacity-30 backdrop-blur-sm"></div>
            {isOwnProfile && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 left-4 bg-background/50 hover:bg-background/70 backdrop-blur-sm z-10"
                  onClick={() => document.getElementById('header-upload')?.click()}
                >
                  <Edit className="h-4 w-4" />
                  <input 
                    id="header-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          // Validate file type
                          const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                          if (!allowedTypes.includes(file.type)) {
                            toast.error('يُسمح فقط بصور JPG و PNG و GIF و WEBP');
                            return;
                          }
                          
                          // Validate file size (max 5MB)
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error('يجب أن يكون حجم الصورة أقل من 5 ميغابايت');
                            return;
                          }

                          // Show loading toast
                          const loadingToast = toast.loading('جاري تحديث صورة الغلاف...');

                          const fileExt = file.name.split('.').pop();
                          const fileName = `${user?.id}-header-${Date.now()}.${fileExt}`;
                          const filePath = `${user?.id}/header/${fileName}`;

                          // Upload file to Supabase Storage profiles bucket
                          const { data: uploadData, error: uploadError } = await supabase.storage
                            .from('profiles')
                            .upload(filePath, file, {
                              cacheControl: '3600',
                              upsert: true
                            });

                          if (uploadError) {
                            toast.dismiss(loadingToast);
                            console.error('Error uploading header image:', uploadError);
                            toast.error('حدث خطأ أثناء تحميل صورة الغلاف');
                            return;
                          }

                          // Get public URL for the uploaded file
                          const { data: { publicUrl } } = supabase.storage
                            .from('profiles')
                            .getPublicUrl(filePath);

                          // Update profile with new header image URL
                          const { error: updateError } = await supabase
                            .from('profiles')
                            .update({ header_image: publicUrl })
                            .eq('id', user?.id);

                          toast.dismiss(loadingToast);
                          
                          if (updateError) {
                            console.error('Error updating profile with header image:', updateError);
                            toast.error('حدث خطأ أثناء تحديث صورة الغلاف');
                            return;
                          }

                          toast.success('تم تحديث صورة الغلاف بنجاح');
                          
                          // Update local state
                          setProfileUser(prev => prev ? {
                            ...prev,
                            header_image: publicUrl
                          } : null);
                        } catch (error) {
                          console.error('Error updating header image:', error);
                          toast.error('حدث خطأ أثناء تحديث صورة الغلاف');
                        }
                      }
                    }}
                  />
                </Button>
              </>
            )}
          </div>
          
          <div className="relative px-6 py-4 pb-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="relative -mt-16 md:-mt-20 z-10">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-md overflow-hidden">
                    <AvatarImage 
                      src={profileUser?.avatar_url} 
                      alt={profileUser?.display_name}
                      className="object-cover"
                    />
                    <AvatarFallback>{profileUser?.display_name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                  </Avatar>
                  {isOwnProfile && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute bottom-0 right-0 bg-background/50 hover:bg-background/70 backdrop-blur-sm z-10"
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                      >
                        <Edit className="h-4 w-4" />
                        <input 
                          id="avatar-upload" 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                // Validate file type
                                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                                if (!allowedTypes.includes(file.type)) {
                                  toast.error('يُسمح فقط بصور JPG و PNG و GIF و WEBP');
                                  return;
                                }
                                
                                // Validate file size (max 5MB)
                                if (file.size > 5 * 1024 * 1024) {
                                  toast.error('يجب أن يكون حجم الصورة أقل من 5 ميغابايت');
                                  return;
                                }
                                
                                // Show loading toast
                                const loadingToast = toast.loading('جاري تحديث الصورة الشخصية...');

                                const fileExt = file.name.split('.').pop();
                                const fileName = `${user?.id}-avatar-${Date.now()}.${fileExt}`;
                                const filePath = `${user?.id}/avatar/${fileName}`;

                                // Upload file to Supabase Storage profiles bucket
                                const { data: uploadData, error: uploadError } = await supabase.storage
                                  .from('profiles')
                                  .upload(filePath, file, {
                                    cacheControl: '3600',
                                    upsert: true
                                  });

                                if (uploadError) {
                                  toast.dismiss(loadingToast);
                                  console.error('Error uploading avatar image:', uploadError);
                                  toast.error('حدث خطأ أثناء تحميل الصورة الشخصية');
                                  return;
                                }

                                // Get public URL for the uploaded file
                                const { data: { publicUrl } } = supabase.storage
                                  .from('profiles')
                                  .getPublicUrl(filePath);

                                // Update profile with new avatar URL
                                const { error: updateError } = await supabase
                                  .from('profiles')
                                  .update({ avatar_url: publicUrl })
                                  .eq('id', user?.id);

                                toast.dismiss(loadingToast);
                                
                                if (updateError) {
                                  console.error('Error updating profile with avatar image:', updateError);
                                  toast.error('حدث خطأ أثناء تحديث الصورة الشخصية');
                                  return;
                                }

                                toast.success('تم تحديث الصورة الشخصية بنجاح');
                                
                                // Update local state
                                setProfileUser(prev => prev ? {
                                  ...prev,
                                  avatar_url: publicUrl
                                } : null);
                              } catch (error) {
                                console.error('Error updating avatar:', error);
                              }
                            }
                          }}
                        />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl font-display font-bold">{profileUser?.display_name}</h1>
                    <p className="text-muted-foreground">@{profileUser?.username}</p>
                  </div>
                  
                  {isOwnProfile ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateReelOpen(true)}
                      >
                        <Film className="h-4 w-4 me-2" />
                        {isRtl ? "إنشاء ريل" : "Create Reel"}
                      </Button>
                      <Button asChild>
                        <Link to="/edit-profile">
                          <Edit className="h-4 w-4 me-2" />
                          {isRtl ? "تعديل الملف الشخصي" : "Edit Profile"}
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        variant={isFollowing ? "outline" : "default"}
                        onClick={handleFollow}
                      >
                        {isFollowing ? (isRtl ? "إلغاء المتابعة" : "Unfollow") : (isRtl ? "متابعة" : "Follow")}
                      </Button>
                      {/* Only show message button if user allows messages */}
                      {(profileUser.allow_messages !== false) && (
                        <Button 
                          variant="outline"
                          asChild
                        >
                          <Link to={`/messages/user/${profileUser.id}`}>
                            <MessageSquare className="h-4 w-4 me-2" />
                            {isRtl ? "مراسلة" : "Message"}
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                
                <p className="max-w-2xl mb-4">{profileUser?.bio}</p>
                
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  {profileUser?.location && (
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="h-4 w-4 me-1" />
                      <span>{profileUser.location}</span>
                    </div>
                  )}
                  {profileUser?.website && (
                    <div className="flex items-center text-muted-foreground">
                      <Link2 className="h-4 w-4 me-1" />
                      <a href={profileUser.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {profileUser.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center text-muted-foreground">
                    <Users className="h-4 w-4 me-1" />
                    <span>
                      <FollowListModal
                        userId={profileUser.id}
                        username={profileUser.username}
                        followersCount={profileUser.followers || 0}
                        followingCount={profileUser.following || 0}
                        trigger={
                          <span className="font-medium text-foreground hover:underline cursor-pointer">
                            {profileUser.followers || 0}
                          </span>
                        }
                      />
                      {isRtl ? " متابع · " : " followers · "}
                      <FollowListModal
                        userId={profileUser.id}
                        username={profileUser.username}
                        followersCount={profileUser.followers || 0}
                        followingCount={profileUser.following || 0}
                        trigger={
                          <span className="font-medium text-foreground hover:underline cursor-pointer">
                            {profileUser.following || 0}
                          </span>
                        }
                      />
                      {isRtl ? " يتابع" : " following"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Profile Content */}
        <Tabs defaultValue="posts" onValueChange={setActiveTab}>
          <TabsList className={`w-full mb-8 ${isRtl ? 'flex-row-reverse' : ''} overflow-x-auto scrollbar-none flex-nowrap sm:flex-wrap`} style={{ WebkitOverflowScrolling: 'touch' }}>
            <TabsTrigger value="posts" className={`group flex-1 min-w-[48px] sm:min-w-[100px] gap-2 ${isRtl ? 'flex-row-reverse' : ''} sm:flex-1 transition-all duration-300 data-[state=active]:min-w-[100px]`}>
              <MessageSquare className="h-5 w-5 flex-shrink-0" />
              <span className="hidden group-data-[state=active]:block sm:inline transition-all duration-300">{isRtl ? "المنشورات" : "Posts"}</span>
            </TabsTrigger>
            <TabsTrigger value="reels" className={`group flex-1 min-w-[48px] sm:min-w-[100px] gap-2 ${isRtl ? 'flex-row-reverse' : ''} sm:flex-1 transition-all duration-300 data-[state=active]:min-w-[100px]`}>
              <Film className="h-5 w-5 flex-shrink-0" />
              <span className="hidden group-data-[state=active]:block sm:inline transition-all duration-300">{isRtl ? "الريلز" : "Reels"}</span>
            </TabsTrigger>
            <TabsTrigger value="media" className={`group flex-1 min-w-[48px] sm:min-w-[100px] gap-2 ${isRtl ? 'flex-row-reverse' : ''} sm:flex-1 transition-all duration-300 data-[state=active]:min-w-[100px]`}>
              <Image className="h-5 w-5 flex-shrink-0" />
              <span className="hidden group-data-[state=active]:block sm:inline transition-all duration-300">{isRtl ? "الوسائط" : "Media"}</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className={`group flex-1 min-w-[48px] sm:min-w-[100px] gap-2 ${isRtl ? 'flex-row-reverse' : ''} sm:flex-1 transition-all duration-300 data-[state=active]:min-w-[100px]`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 flex-shrink-0">
                <path d="M15 3v18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1z"></path>
                <path d="M18 6v15a1 1 0 0 1-1 1h-2"></path>
                <path d="M21 9V6a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1z"></path>
              </svg>
              <span className="hidden group-data-[state=active]:block sm:inline transition-all duration-300">{isRtl ? "المشاريع" : "Projects"}</span>
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="likes" className={`group flex-1 min-w-[48px] sm:min-w-[100px] gap-2 ${isRtl ? 'flex-row-reverse' : ''} sm:flex-1 transition-all duration-300 data-[state=active]:min-w-[100px]`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 flex-shrink-0">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                </svg>
                <span className="hidden group-data-[state=active]:block sm:inline transition-all duration-300">{isRtl ? "الإعجابات" : "Likes"}</span>
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="posts" className="mt-0">
            {loadingTab ? (
              <div className="space-y-6">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="bg-card rounded-lg border p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                    <div className="h-4 w-full bg-muted animate-pulse rounded" />
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            ) : userPosts.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <h3 className="text-lg font-medium mb-2">{isRtl ? "لا توجد منشورات بعد" : "No posts yet"}</h3>
                <p className="text-muted-foreground">
                  {isOwnProfile ? 
                    (isRtl ? "ابدأ بمشاركة أعمالك مع المجتمع" : "Start sharing your work with the community") : 
                    (isRtl ? "سيظهر هنا المنشورات عند نشرها" : "Posts will appear here when published")}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {userPosts.map((post) => (
                  <Link to={`/post/${post.id}`} key={post.id}>
                    <PostCard 
                      post={post} 
                    />
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="reels" className="mt-0" dir={isRtl ? 'rtl' : 'ltr'}>
            {loadingTab ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array(8).fill(0).map((_, i) => (
                  <div key={i} className="aspect-[9/16] rounded-md bg-muted animate-pulse" />
                ))}
              </div>
            ) : reels.filter(reel => reel.user_id === profileUser?.id).length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <h3 className="text-lg font-medium mb-2">{isRtl ? "لا توجد ريلز بعد" : "No reels yet"}</h3>
                <p className="text-muted-foreground">
                  {isOwnProfile ? (
                    <>
                      {isRtl ? "ابدأ بمشاركة ريلز مع المجتمع" : "Start sharing reels with the community"}{" "}
                      <Button 
                        variant="link" 
                        className="px-0 py-0 h-auto" 
                        onClick={() => setIsCreateReelOpen(true)}
                      >
                        {isRtl ? "إنشاء ريل جديد" : "Create a new reel"}
                      </Button>
                    </>
                  ) : (
                    isRtl ? "سيظهر هنا الريلز عند نشرها" : "Reels will appear here when published"
                  )}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {reels
                  .filter(reel => reel.user_id === profileUser?.id)
                  .map((reel) => {
                    // Convert to ReelWithUser format
                    const reelWithUser = {
                      id: reel.id,
                      caption: reel.caption,
                      video_url: reel.video_url,
                      thumbnail_url: reel.thumbnail_url,
                      duration: reel.duration,
                      createdAt: new Date(reel.created_at),
                      user: {
                        id: reel.user_id,
                        username: profileUser?.username || "",
                        displayName: profileUser?.display_name || "",
                        avatar: profileUser?.avatar_url || ""
                      },
                      likes: reel.likes_count || 0,
                      comments: reel.comments_count || 0,
                      views: reel.views_count || 0,
                      isLiked: false
                    };
                    
                    return (
                      <div key={reel.id} className="aspect-[9/16]">
                        <ReelCard 
                          reel={reelWithUser} 
                          isActive={true}
                          onView={viewReel}
                          onLike={likeReel}
                          onDelete={() => {
                            // Refetch profile data to update reels list
                            setLoadingTab(true);
                            setTimeout(() => setLoadingTab(false), 500);
                          }}
                        />
                      </div>
                    );
                  })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="media" className="mt-0">
            {loadingTab ? (
              <div dir={isRtl ? 'rtl' : 'ltr'} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="aspect-square rounded-md bg-muted animate-pulse" />
                ))}
              </div>
            ) : userMediaPosts.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <h3 className="text-lg font-medium mb-2">{isRtl ? "لا توجد وسائط بعد" : "No media yet"}</h3>
                <p className="text-muted-foreground">
                  {isOwnProfile ? 
                    (isRtl ? "ابدأ بمشاركة صور وفيديوهات مع المجتمع" : "Start sharing photos and videos with the community") : 
                    (isRtl ? "سيظهر هنا الوسائط عند نشرها" : "Media will appear here when published")}
                </p>
              </div>
            ) : (
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${isRtl ? 'flex-row-reverse' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
                {userMediaPosts.map((post) => (
                  <Link to={`/post/${post.id}`} key={post.id} className="group relative aspect-square rounded-md overflow-hidden bg-muted">
                    <img 
                      src={post.image} 
                      alt="" 
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-white">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                          </svg>
                          <span>{post.likes}</span>
                        </div>
                        <div className="flex items-center gap-1 text-white">
                          <MessageSquare className="h-5 w-5" />
                          <span>{post.comments}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
          
          {isOwnProfile && (
            <TabsContent value="likes" className="mt-0">
              {loadingTab ? (
                <div className="space-y-6">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="bg-card rounded-lg border p-4 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                        <div className="space-y-2">
                          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                          <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                        </div>
                      </div>
                      <div className="h-4 w-full bg-muted animate-pulse rounded" />
                      <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              ) : userLikedPosts.length === 0 ? (
                <div className="text-center py-12 border rounded-lg">
                  <h3 className="text-lg font-medium mb-2">{isRtl ? "لا توجد إعجابات بعد" : "No likes yet"}</h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile ? 
                      (isRtl ? "ستظهر هنا المنشورات التي أعجبت بها" : "Posts you like will appear here") : 
                      (isRtl ? "سيظهر هنا المنشورات التي أعجب بها" : "Liked posts will appear here")}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {userLikedPosts.map((post) => (
                    <Link to={`/post/${post.id}`} key={post.id}>
                      <PostCard 
                        post={post} 
                      />
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
          
          <TabsContent value="projects" className="mt-0">
            {loadingProjects ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-video w-full" />
                    <CardHeader>
                      <Skeleton className="h-6 w-2/3" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent className="pb-0">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-8 w-20" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : userProjects.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <h3 className="text-lg font-medium mb-2">{isRtl ? "لا توجد مشاريع بعد" : "No projects yet"}</h3>
                <p className="text-muted-foreground">
                  {isOwnProfile ? 
                    (isRtl ? "ابدأ بمشاركة مشاريعك الإبداعية" : "Start sharing your creative projects") : 
                    (isRtl ? "سيظهر هنا المشاريع عند نشرها" : "Projects will appear here when published")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {userProjects.map((project) => (
                  <Card key={project.id} className="overflow-hidden">
                    <Link to={`/projects/${project.id}`} className="block aspect-video relative overflow-hidden">
                      <img 
                        src={project.cover_image_url || "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1000"} 
                        alt={project.title} 
                        className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                      />
                    </Link>
                    <CardHeader>
                      <CardTitle className="text-xl line-clamp-1 text-start rtl:text-right">
                        <Link to={`/projects/${project.id}`} className="hover:underline">
                          {project.title}
                        </Link>
                      </CardTitle>
                      <p className="text-muted-foreground line-clamp-2 h-18 text-start rtl:text-right leading-6">{project.description}</p>
                    </CardHeader>
                    <CardContent className="pb-0">
                      <div className="flex flex-wrap gap-2 mb-4 h-6 overflow-hidden">
                        {project.tags.slice(0, 3).map((tag, i) => (
                          <Badge key={i} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span>{project.views}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-2" 
                        asChild
                      >
                        <Link to={`/projects/${project.id}`}>
                          <LinkIcon className="h-4 w-4" />
                          <span>{isRtl ? "عرض" : "View"}</span>
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Create Reel Dialog */}
      <CreateReelDialog 
        open={isCreateReelOpen} 
        onOpenChange={setIsCreateReelOpen} 
        onReelCreated={() => setIsCreateReelOpen(false)}
      />
    </Layout>
  );
};

export default Profile;

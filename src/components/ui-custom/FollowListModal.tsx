import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { UserPlus, UserMinus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";

interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  is_following?: boolean;
}

interface FollowListModalProps {
  userId: string;
  username: string;
  followersCount: number;
  followingCount: number;
  trigger?: React.ReactNode;
}

export function FollowListModal({
  userId,
  username,
  followersCount,
  followingCount,
  trigger,
}: FollowListModalProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("followers");
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const { t, isRtl } = useTranslation();

  useEffect(() => {
    if (open) {
      loadFollowData();
    }
  }, [open, activeTab, userId]);

  const loadFollowData = async () => {
    setLoading(true);
    try {
      if (activeTab === "followers") {
        // Load followers
        const { data, error } = await supabase
          .from("followers")
          .select(`
            follower:profiles!followers_follower_id_fkey (
              id,
              username,
              display_name,
              avatar_url
            )
          `)
          .eq("following_id", userId);

        if (error) throw error;

        const followersList = data.map((item) => ({
          id: item.follower.id,
          username: item.follower.username,
          display_name: item.follower.display_name,
          avatar_url: item.follower.avatar_url,
        }));

        // Check if current user is following each follower
        if (isAuthenticated && user) {
          const followingStatuses = await Promise.all(
            followersList.map(async (follower) => {
              const { data: isFollowing } = await supabase.rpc("is_following", {
                follower_id: user.id,
                following_id: follower.id,
              });
              return { ...follower, is_following: isFollowing };
            })
          );
          setFollowers(followingStatuses);
        } else {
          setFollowers(followersList);
        }
      } else {
        // Load following
        const { data, error } = await supabase
          .from("followers")
          .select(`
            following:profiles!followers_following_id_fkey (
              id,
              username,
              display_name,
              avatar_url
            )
          `)
          .eq("follower_id", userId);

        if (error) throw error;

        const followingList = data.map((item) => ({
          id: item.following.id,
          username: item.following.username,
          display_name: item.following.display_name,
          avatar_url: item.following.avatar_url,
        }));

        // Check if current user is following each user
        if (isAuthenticated && user) {
          const followingStatuses = await Promise.all(
            followingList.map(async (following) => {
              const { data: isFollowing } = await supabase.rpc("is_following", {
                follower_id: user.id,
                following_id: following.id,
              });
              return { ...following, is_following: isFollowing };
            })
          );
          setFollowing(followingStatuses);
        } else {
          setFollowing(followingList);
        }
      }
    } catch (error) {
      console.error("Error loading follow data:", error);
      toast.error(isRtl ? "حدث خطأ أثناء تحميل البيانات" : "Error loading data");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    if (!isAuthenticated || !user) {
      toast.error(isRtl ? "يجب تسجيل الدخول أولاً" : "You must be logged in");
      return;
    }

    try {
      if (isCurrentlyFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("followers")
          .delete()
          .match({
            follower_id: user.id,
            following_id: targetUserId,
          });

        if (error) throw error;

        // Update UI
        if (activeTab === "followers") {
          setFollowers((prev) =>
            prev.map((follower) =>
              follower.id === targetUserId
                ? { ...follower, is_following: false }
                : follower
            )
          );
        } else {
          setFollowing((prev) =>
            prev.map((following) =>
              following.id === targetUserId
                ? { ...following, is_following: false }
                : following
            )
          );
        }

        toast.success(isRtl ? "تم إلغاء المتابعة بنجاح" : "Successfully unfollowed");
      } else {
        // Follow
        const { error } = await supabase
          .from("followers")
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
          });

        if (error) throw error;

        // Update UI
        if (activeTab === "followers") {
          setFollowers((prev) =>
            prev.map((follower) =>
              follower.id === targetUserId
                ? { ...follower, is_following: true }
                : follower
            )
          );
        } else {
          setFollowing((prev) =>
            prev.map((following) =>
              following.id === targetUserId
                ? { ...following, is_following: true }
                : following
            )
          );
        }

        toast.success(isRtl ? "تم المتابعة بنجاح" : "Successfully followed");
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error(
        isRtl ? "حدث خطأ أثناء تحديث حالة المتابعة" : "Error updating follow status"
      );
    }
  };

  const UserList = ({ users }: { users: User[] }) => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {activeTab === "followers"
            ? isRtl
              ? "لا يوجد متابعين بعد"
              : "No followers yet"
            : isRtl
            ? "لا يتابع أحداً بعد"
            : "Not following anyone yet"}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between">
            <Link
              to={`/profile/${user.username}`}
              className="flex items-center gap-3 flex-1"
              onClick={() => setOpen(false)}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar_url} alt={user.display_name} />
                <AvatarFallback>{user.display_name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{user.display_name}</div>
                <div className="text-sm text-muted-foreground">
                  @{user.username}
                </div>
              </div>
            </Link>
            {isAuthenticated && user.id !== user.id && (
              <Button
                variant={user.is_following ? "outline" : "default"}
                size="sm"
                onClick={() => handleFollow(user.id, user.is_following || false)}
              >
                {user.is_following ? (
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
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" className="h-auto p-0">
            <span className="font-medium">{followersCount}</span>{" "}
            {isRtl ? "متابع" : "followers"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {username} - {activeTab === "followers" ? (isRtl ? "المتابعون" : "Followers") : (isRtl ? "يتابع" : "Following")}
          </DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers">
              {isRtl ? "المتابعون" : "Followers"} ({followersCount})
            </TabsTrigger>
            <TabsTrigger value="following">
              {isRtl ? "يتابع" : "Following"} ({followingCount})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="followers" className="mt-4">
            <UserList users={followers} />
          </TabsContent>
          <TabsContent value="following" className="mt-4">
            <UserList users={following} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 
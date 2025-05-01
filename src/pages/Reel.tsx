import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ReelCard } from "@/components/ui-custom/ReelCard";
import { ReelCommentsSection } from "@/components/ui-custom/ReelCommentsSection";
import { useReels } from "@/hooks/use-reels";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function Reel() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { reels, likeReel, viewReel, checkIfReelLiked } = useReels();
  const { isAuthenticated } = useAuth();
  const { isRtl, t } = useTranslation();
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Find the current reel
  const currentReel = reels.find(reel => reel.id === id);

  // Convert Reel to ReelWithUser format
  const reelWithUser = currentReel ? {
    id: currentReel.id,
    caption: currentReel.caption,
    video_url: currentReel.video_url,
    thumbnail_url: currentReel.thumbnail_url,
    duration: currentReel.duration,
    createdAt: new Date(currentReel.created_at),
    user: {
      id: currentReel.user_id,
      username: currentReel.user?.username || "",
      displayName: currentReel.user?.display_name || "",
      avatar: currentReel.user?.avatar_url || ""
    },
    likes: currentReel.likes_count || 0,
    comments: currentReel.comments_count || 0,
    views: currentReel.views_count || 0,
    isLiked: isLiked
  } : null;

  useEffect(() => {
    if (!reelWithUser) {
      toast.error(isRtl ? "لم يتم العثور على الريل" : "Reel not found");
      navigate("/");
      return;
    }

    // Check if the current user has liked this reel
    const checkLikeStatus = async () => {
      if (isAuthenticated) {
        const liked = await checkIfReelLiked(reelWithUser.id);
        setIsLiked(liked);
      }
    };

    checkLikeStatus();
    setIsLoading(false);

    // Increment view count when reel is viewed
    viewReel(reelWithUser.id);
  }, [reelWithUser, isAuthenticated, checkIfReelLiked, viewReel, navigate, isRtl]);

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-4">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="aspect-[9/16] w-full rounded-lg" />
        </div>
      </Layout>
    );
  }

  if (!reelWithUser) {
    return null;
  }

  const handleLike = () => {
    if (!isAuthenticated) {
      toast.error(isRtl ? "يجب تسجيل الدخول أولاً" : "You must be logged in");
      return;
    }
    likeReel(reelWithUser.id);
    setIsLiked(!isLiked);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {isRtl ? "العودة" : "Back"}
        </Button>

        <ReelCard
          reel={reelWithUser}
          isActive={true}
          onLike={handleLike}
          onView={viewReel}
          onDelete={() => navigate("/")}
        />
        
        <Card className="mt-6">
          <CardContent className="pt-6">
            <ReelCommentsSection reelId={reelWithUser.id} />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
} 
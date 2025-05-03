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
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ReelCardSingle } from "@/components/ui-custom/ReelCardsingle";

export default function Reel() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { reels, likeReel, viewReel, checkIfReelLiked } = useReels();
  const { isAuthenticated } = useAuth();
  const { isRtl, t } = useTranslation();
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const cn = (...classes: string[]) => classes.filter(Boolean).join(" ");

  // Find the current reel and get adjacent reels
  const currentReelIndex = reels.findIndex(reel => reel.id === id);
  const currentReel = reels[currentReelIndex];
  const nextReel = reels[currentReelIndex + 1];
  const prevReel = reels[currentReelIndex - 1];

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

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isSwipeUp = distance > 50;
    const isSwipeDown = distance < -50;

    if (isSwipeUp && nextReel) {
      navigate(`/reel/${nextReel.id}`);
    } else if (isSwipeDown && prevReel) {
      navigate(`/reel/${prevReel.id}`);
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <Layout>
      <div 
        className="fixed inset-0 bg-black md:static md:bg-transparent"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="h-full md:max-w-2xl md:mx-auto md:p-4 relative flex justify-between flex-auto">
          

          <div className="h-full flex items-center justify-center">
            <ReelCardSingle
              reel={reelWithUser}
              isActive={true}
              onLike={handleLike}
              onView={viewReel}
              onDelete={() => navigate("/")}
              className={cn(isMobile ? "w-full h-full max-h-screen object-contain" : "h-full max-h-[80vh] max-w-[300px] aspect-[9/16] object-contain")}
            />
          </div>
          
          {isMobile ? (
            <>
              <Button
                variant="ghost"
                className="fixed bottom-3 left-20 z-20 bg-background/95 backdrop-blur rounded-full shadow-lg hover:shadow-xl transition-shadow"
                onClick={() => setIsCommentsOpen(true)}
              >
                <MessageCircle className="h-6 w-6" />{t('comments')}
              </Button>

              <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
                <DialogContent className="sm:max-w-[425px] h-[80vh]">
                  <ReelCommentsSection reelId={reelWithUser.id} />
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <Card className="rounded-lg border mx-6">
              <CardContent className="pt-6">
                <ReelCommentsSection reelId={reelWithUser.id} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
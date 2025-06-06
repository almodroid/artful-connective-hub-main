import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { ReelCard } from "@/components/ui-custom/ReelCard";
import { useReels } from "@/hooks/use-reels";
import { useTranslation } from "@/hooks/use-translation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Info } from "lucide-react";
import { CreateReelDialog } from "@/components/ui-custom/CreateReelDialog";
import { ReelWithUser } from "@/hooks/use-reels";
import { ReelUploadGuidelines } from "@/components/ui-custom/ReelUploadGuidelines";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

const Reels = () => {
  const { t, isRtl } = useTranslation();
  const { user } = useAuth();
  const { reels, isLoading, hasMore, loadMore, viewReel, likeReel, checkIfReelLiked } = useReels();
  const [isCreateReelOpen, setIsCreateReelOpen] = useState(false);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [likedReels, setLikedReels] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Check which reels are liked by the current user
    const checkLikedReels = async () => {
      if (!user) return;
      
      const likedStatus: Record<string, boolean> = {};
      
      // For each reel, check if it's liked
      for (const reel of reels) {
        likedStatus[reel.id] = await checkIfReelLiked(reel.id);
      }
      
      setLikedReels(likedStatus);
    };
    
    checkLikedReels();
  }, [reels, user, checkIfReelLiked]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      await loadMore();
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-display font-bold">{t('reels')}</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setIsGuidelinesOpen(true)}
            >
              <Info className="h-4 w-4" />
              {t('guidelines')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsCreateReelOpen(true)}
            >
              <Plus className="h-4 w-4 me-2" />
              {t('createReel')}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="aspect-[9/16] rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        ) : reels.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <h3 className="text-lg font-medium mb-2">{t('noReels')}</h3>
            <p className="text-muted-foreground">
              {t('startSharingReels')}{" "}
              <Button 
                variant="link" 
                className="px-0 py-0 h-auto" 
                onClick={() => setIsCreateReelOpen(true)}
              >
                {t('createNewReel')}
              </Button>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {reels.map((reel) => {
              // Convert to ReelWithUser format
              const reelWithUser: ReelWithUser = {
                ...reel,
                createdAt: new Date(reel.created_at),
                likes: reel.likes_count || 0,
                comments: reel.comments_count || 0,
                views: reel.views_count || 0,
                isLiked: likedReels[reel.id] || false,
                user: {
                  id: reel.user_id,
                  username: reel.user?.username || "unknown",
                  displayName: reel.user?.display_name || "Unknown User",
                  avatar: reel.user?.avatar_url || ""
                }
              };

              return (
                <div key={reel.id} className="aspect-[9/16]">
                  <ReelCard 
                    reel={reelWithUser} 
                    isActive={true}
                    onLike={likeReel}
                    onView={(reelId) => {
                      // Navigate to reel detail page when clicking outside video controls
                      const handleCardClick = (e: React.MouseEvent) => {
                        const target = e.target as HTMLElement;
                        if (!target.closest('.video-controls') && !target.closest('.reel-link')) {
                          window.location.href = `/reel/${reelId}`;
                        }
                      };
                      
                      return (
                        <div onClick={handleCardClick}>
                          <ReelCard 
                            reel={reelWithUser} 
                            isActive={true}
                            onLike={likeReel}
                            onView={viewReel}
                          />
                        </div>
                      );
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {hasMore && (
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? t('loading') : t('loadMore')}
            </Button>
          </div>
        )}
      </div>

      <CreateReelDialog 
        open={isCreateReelOpen} 
        onOpenChange={setIsCreateReelOpen} 
        onReelCreated={() => setIsCreateReelOpen(false)}
      />

      <Dialog open={isGuidelinesOpen} onOpenChange={setIsGuidelinesOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isRtl ? "إرشادات الريل" : "Reel Guidelines"}</DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <ReelUploadGuidelines detailed={true} />
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Reels; 
import { useState, useRef, useEffect } from "react";
import { useReels, ReelWithUser } from "@/hooks/use-reels";
import { ReelCard } from "./ReelCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/use-translation";
import { CreateReelDialog } from "./CreateReelDialog";
import "./reels.css";
import { cn } from "@/lib/utils";

const REELS_PER_PAGE = 8;

interface ReelsSectionProps {
  isActive?: boolean;
  showHeader?: boolean;
  sectionIndex?: number;
}

export function ReelsSection({ isActive = false, showHeader = true, sectionIndex = 0 }: ReelsSectionProps) {
  const { reels, isLoading, likeReel, viewReel, hasMore, loadMore } = useReels();
  const { isAuthenticated } = useAuth();
  const { t, isRtl } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCreateReelOpen, setIsCreateReelOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [initialScrollLeft, setInitialScrollLeft] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Use reels directly from the query without additional sorting
  const reelsWithUser = reels
    .map(reel => ({
      id: reel.id,
      caption: reel.caption,
      video_url: reel.video_url,
      thumbnail_url: reel.thumbnail_url,
      duration: reel.duration,
      createdAt: new Date(reel.created_at),
      user: {
        id: reel.user_id,
        username: reel.user?.username || "unknown",
        displayName: reel.user?.display_name || "Unknown User",
        avatar: reel.user?.avatar_url || "",
      },
      likes: reel.likes_count || 0,
      comments: reel.comments_count || 0,
      views: reel.views_count || 0,
      isLiked: false
    }));

  // Take a subset of reels for this section
  const sectionReels = reelsWithUser.slice(0, 4);

  // Handle scroll navigation
  const handleScrollLeft = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollAmount = container.offsetWidth;
    container.scrollBy({
      left: isRtl ? scrollAmount : -scrollAmount,
      behavior: 'smooth'
    });
  };

  const handleScrollRight = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollAmount = container.offsetWidth;
    container.scrollBy({
      left: isRtl ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  // Handle drag events
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.clientX);
    setInitialScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.clientX;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = initialScrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Handle touch events
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setInitialScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.touches[0].clientX;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = initialScrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Handle infinite scroll and loop
  useEffect(() => {
    if (!scrollContainerRef.current || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, loadMore]);

  // Handle scroll events
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollPosition = container.scrollLeft;
    const itemWidth = 220 + 12; // width + gap
    const newIndex = Math.round(scrollPosition / itemWidth);
    
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  const handleReelCreated = () => {
    setIsCreateReelOpen(false);
    // The reels will be refetched automatically by the useReels hook
  };

  // Add scroll snap behavior
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.scrollSnapType = 'x mandatory';
      scrollContainerRef.current.style.scrollBehavior = 'smooth';
      if (isRtl) {
        scrollContainerRef.current.style.direction = 'rtl';
      }
    }
  }, [isRtl]);

  // If there are no reels and not loading, don't render the section
  if (sectionReels.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="mb-8 px-5">
      {showHeader && (
        <div className="flex justify-between items-center mb-4" dir={isRtl? 'rtl' :'ltr'}>
          <h2 className="text-lg font-semibold m-2">
            {sectionIndex === 0 ? t('reels') : t('moreReels')}
          </h2>
          {isAuthenticated && (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1"
              onClick={() => setIsCreateReelOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span>{t('createReel')}</span>
            </Button>
          )}
        </div>
      )}

      <div className="relative">
        {/* Navigation Arrows */}
        <div className={`absolute inset-y-0 ${isRtl ? 'right-0' : 'left-0'} flex items-center z-10`}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70 shadow-lg"
            onClick={handleScrollLeft}
            disabled={activeIndex === 0}
          >
            {isRtl ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>
        
        <div className={`absolute inset-y-0 ${isRtl ? 'left-0' : 'right-0'} flex items-center z-10`}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70 shadow-lg"
            onClick={handleScrollRight}
            disabled={activeIndex >= sectionReels.length - 1}
          >
            {isRtl ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </Button>
        </div>

        {/* Reels Container */}
        <div 
          ref={scrollContainerRef}
          className={`reels-scroll-container flex overflow-x-auto gap-1 pb-6 hide-scrollbar px-6 ${isRtl ? 'rtl' : 'ltr'} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {isLoading && sectionReels.length === 0 ? (
            // Loading skeletons
            Array(4).fill(0).map((_, i) => (
              <div 
                key={i} 
                className="flex-shrink-0 w-[230px] h-[350px] rounded-md reel-skeleton snap-start"
              />
            ))
          ) : (
            sectionReels.map((reel, index) => (
              <div 
                key={reel.id} 
                className="flex-shrink-0 w-[250px] h-[350px] reel-card object-cover"
              >
                <ReelCard 
                  reel={reel} 
                  onLike={likeReel}
                  onView={viewReel}
                  isActive={isActive && index === activeIndex}
                  className="h-full"
                />
              </div>
            ))
          )}
        </div>

        {/* Load more trigger */}
        {hasMore && (
          <div 
            ref={loadMoreRef} 
            className="h-20 flex items-center justify-center"
          >
            {isLoading && (
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        )}
      </div>

      {/* Create Reel Dialog */}
      <CreateReelDialog 
        open={isCreateReelOpen} 
        onOpenChange={setIsCreateReelOpen} 
        onReelCreated={handleReelCreated}
      />
    </div>
  );
}
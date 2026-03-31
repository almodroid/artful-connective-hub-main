import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ReelCommentsSection } from "@/components/ui-custom/ReelCommentsSection";
import { useReels } from "@/hooks/use-reels";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import { ArrowLeft, ArrowRight, MessageCircle, Heart, Share2, MoreVertical, Trash, Flag, Check, ChevronUp, ChevronDown, Play, Pause } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ReelCardSingle } from "@/components/ui-custom/ReelCardsingle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShareModal } from "@/components/ui-custom/ShareModal";

const mockReel = {
  id: "demo-reel-1",
  caption: "مجنون يخي كيف سويته حاولت كثير بس ماعرفت",
  video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  thumbnail_url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800",
  duration: 60,
  created_at: new Date().toISOString(),
  user_id: "demo-user-1",
  user: {
    id: "demo-user-1",
    username: "artisan_demo",
    display_name: "فنان مبدع",
    avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
  },
  likes_count: 1250,
  comments_count: 89,
  views_count: 15200
};

export default function Reel() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { reels, likeReel, viewReel, checkIfReelLiked, deleteReel, reportReel } = useReels();
  const { isAuthenticated, user } = useAuth();
  const { isRtl, t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);

  const currentReelIndex = reels.findIndex(reel => reel.id === id);
  const currentReel = reels[currentReelIndex];
  const nextReel = reels[currentReelIndex + 1];
  const prevReel = reels[currentReelIndex - 1];
  const demoReel = id === "1" || id === "demo" || id === "demo-reel-1" ? mockReel : null;

  const reelWithUser = useMemo(() => {
    if (currentReel) {
      return {
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
        isLiked: isLiked,
        nextReelId: nextReel?.id
      };
    } else if (demoReel) {
      return {
        id: demoReel.id,
        caption: demoReel.caption,
        video_url: demoReel.video_url,
        thumbnail_url: demoReel.thumbnail_url,
        duration: demoReel.duration,
        createdAt: new Date(demoReel.created_at),
        user: {
          id: demoReel.user_id,
          username: demoReel.user.username,
          displayName: demoReel.user.display_name,
          avatar: demoReel.user.avatar_url
        },
        likes: demoReel.likes_count,
        comments: demoReel.comments_count,
        views: demoReel.views_count,
        isLiked: isLiked,
        nextReelId: undefined
      };
    }
    return null;
  }, [currentReel, demoReel, isLiked, nextReel?.id]);

  const handleLike = useCallback(() => {
    if (!isAuthenticated) {
      toast.error(isRtl ? "يجب تسجيل الدخول أولاً" : "You must be logged in");
      return;
    }
    if (reelWithUser) likeReel(reelWithUser.id);
    setIsLiked(prev => !prev);
  }, [isAuthenticated, isRtl, reelWithUser, likeReel]);

  const handleDeleteReel = useCallback(async () => {
    if (!isAuthenticated || !reelWithUser) return;
    if (user?.id !== reelWithUser.user.id) return;
    setIsSubmitting(true);
    try {
      await deleteReel(reelWithUser.id);
      setIsDeleteDialogOpen(false);
      navigate("/");
    } finally {
      setIsSubmitting(false);
    }
  }, [isAuthenticated, reelWithUser, user, navigate, deleteReel]);

  const handleReportReel = useCallback(async () => {
    if (!isAuthenticated || !reelWithUser || !reportReason.trim()) return;
    setIsSubmitting(true);
    try {
      await reportReel(reelWithUser.id, reportReason);
      setIsReportDialogOpen(false);
      setReportReason("");
    } finally {
      setIsSubmitting(false);
    }
  }, [isAuthenticated, reelWithUser, reportReason, reportReel]);

  const goToNext = useCallback(() => {
    if (nextReel) navigate(`/reel/${nextReel.id}`);
  }, [nextReel, navigate]);

  const goToPrev = useCallback(() => {
    if (prevReel) navigate(`/reel/${prevReel.id}`);
  }, [prevReel, navigate]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    if (!reelWithUser) return;

    const checkLikeStatus = async () => {
      if (isAuthenticated) {
        const liked = await checkIfReelLiked(reelWithUser.id);
        setIsLiked(liked);
      }
    };
    checkLikeStatus();
    setIsLoading(false);

    if (reelWithUser.id !== "demo-reel-1") {
      viewReel(reelWithUser.id);
    }
  }, [reelWithUser, isAuthenticated, checkIfReelLiked, viewReel]);

  useEffect(() => {
    const videoElement = videoRef.current;
    const handleVideoEnd = () => {
      if (autoAdvance && nextReel) navigate(`/reel/${nextReel.id}`);
    };
    if (videoElement) {
      videoElement.addEventListener('ended', handleVideoEnd);
      return () => videoElement.removeEventListener('ended', handleVideoEnd);
    }
  }, [nextReel, navigate, autoAdvance]);

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
    return (
      <Layout>
        <div className="fixed inset-0 bg-black flex items-center justify-center">
          <p className="text-white">{isRtl ? "جاري التحميل..." : "Loading..."}</p>
        </div>
      </Layout>
    );
  }

  const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

  const ActionButtons = ({ size = "desktop" }: { size?: "desktop" | "mobile" }) => (
    <div className={cn(
      "flex flex-col items-center gap-6",
      size === "mobile" && "gap-4",
      isRtl ? "order-first" : "order-last"
    )}>
      <button onClick={() => navigate(-1)} className="flex flex-col items-center gap-1 group">
        <div className={cn("rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-white/20", size === "desktop" ? "w-12 h-12" : "w-10 h-10")}>
          {isRtl ? <ArrowRight className={size === "desktop" ? "h-7 w-7" : "h-6 w-6"} /> : <ArrowLeft className={size === "desktop" ? "h-7 w-7" : "h-6 w-6"} />}
        </div>
        <span className={cn("text-white/60 font-medium", size === "desktop" ? "text-xs" : "text-[10px]")}>{isRtl ? "رجوع" : "Back"}</span>
      </button>

      <button onClick={() => { if (!isAuthenticated) { toast.error(isRtl ? "يجب تسجيل الدخول أولاً" : "Please login first"); return; } toast.success(isRtl ? "تم متابعة المستخدم" : "Following user"); }} className="flex flex-col items-center gap-1 group">
        <div className="relative">
          <Avatar className={cn("border-2 border-white/20", size === "desktop" ? "h-12 w-12" : "h-10 w-10")}>
            <AvatarImage src={reelWithUser.user.avatar} alt={reelWithUser.user.displayName} />
            <AvatarFallback>{reelWithUser.user.displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className={cn("absolute bg-primary rounded-full flex items-center justify-center border-2 border-black", size === "desktop" ? "-bottom-1 -right-1 w-5 h-5" : "-bottom-1 -right-1 w-4 h-4")}>
            <span className="text-white font-bold" style={{ fontSize: size === "desktop" ? "10px" : "8px" }}>+</span>
          </div>
        </div>
      </button>

      <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
        <div className={cn("rounded-full flex items-center justify-center transition-all bg-white/10 hover:bg-white/20", size === "desktop" ? "w-12 h-12" : "w-10 h-10", isLiked && "text-red-500 bg-red-500/10 hover:bg-red-500/20")}>
          <Heart className={cn(size === "desktop" ? "h-7 w-7" : "h-6 w-6", isLiked && "fill-current")} />
        </div>
        <span className="text-white/60 font-medium" style={{ fontSize: size === "desktop" ? "12px" : "10px" }}>{reelWithUser.likes}</span>
      </button>

      <button onClick={() => setIsCommentsOpen(!isCommentsOpen)} className="flex flex-col items-center gap-1 group">
        <div className={cn("rounded-full flex items-center justify-center transition-colors", size === "desktop" ? "w-12 h-12" : "w-10 h-10", isCommentsOpen ? "bg-[#6805AF] text-white" : "bg-white/10 text-white hover:bg-white/20")}>
          <MessageCircle className={size === "desktop" ? "h-7 w-7" : "h-6 w-6"} />
        </div>
        <span className="text-white/60 font-medium" style={{ fontSize: size === "desktop" ? "12px" : "10px" }}>{reelWithUser.comments}</span>
      </button>

      <button onClick={() => setIsShareModalOpen(true)} className="flex flex-col items-center gap-1 group">
        <div className={cn("rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-white/20", size === "desktop" ? "w-12 h-12" : "w-10 h-10")}>
          <Share2 className={size === "desktop" ? "h-7 w-7" : "h-6 w-6"} />
        </div>
        <span className="text-white/60 font-medium" style={{ fontSize: size === "desktop" ? "12px" : "10px" }}>{isRtl ? "مشاركة" : "Share"}</span>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex flex-col items-center gap-1 group">
            <div className={cn("rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-white/20", size === "desktop" ? "w-12 h-12" : "w-10 h-10")}>
              <MoreVertical className={size === "desktop" ? "h-7 w-7" : "h-6 w-6"} />
            </div>
            <span className="text-white/60 font-medium" style={{ fontSize: size === "desktop" ? "12px" : "10px" }}>{isRtl ? "المزيد" : "More"}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-48 bg-black/90 border-white/10 text-white">
          {user?.id === reelWithUser.user.id ? (
            <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => setIsDeleteDialogOpen(true)} dir={isRtl ? "rtl" : "ltr"}>
              <Trash className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              {isRtl ? "حذف الريل" : "Delete Reel"}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setIsReportDialogOpen(true)} dir={isRtl ? "rtl" : "ltr"} className="focus:bg-white/10">
              <Flag className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              {isRtl ? "الإبلاغ عن الريل" : "Report Reel"}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator className="bg-white/10" />
          {[1, 1.5, 2].map(speed => (
            <DropdownMenuItem key={speed} onClick={() => setPlaybackSpeed(speed)} dir={isRtl ? "rtl" : "ltr"} className="flex justify-between items-center focus:bg-white/10">
              <span>{isRtl ? `السرعة ${speed}x` : `Speed ${speed}x`}</span>
              {playbackSpeed === speed && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <Layout hideSidebars hideBottomBar hideFooter forceDarkMode>
      <div className="fixed inset-0 bg-black overflow-hidden">
        {/* Desktop Layout */}
        <div className="hidden md:flex h-full pt-16">
          {/* Video Container - Absolute positioning */}
          <div className="relative flex-1 flex items-center justify-center">
            {/* Content wrapper centered */}
            <div className="flex items-center gap-6">
              {/* RTL: Action Buttons on LEFT of video, LTR: Nav Arrows on LEFT */}
              {isRtl ? <ActionButtons size="desktop" /> : (
                <div className="flex flex-col gap-4">
                  <button onClick={goToPrev} disabled={!prevReel} className={cn("w-12 h-12 rounded-full flex items-center justify-center bg-white/10 text-white backdrop-blur-md transition-all", !prevReel ? "opacity-30 cursor-not-allowed" : "hover:bg-white/20")}>
                    <ChevronUp className="h-8 w-8" />
                  </button>
                  <button onClick={goToNext} disabled={!nextReel} className={cn("w-12 h-12 rounded-full flex items-center justify-center bg-white/10 text-white backdrop-blur-md transition-all", !nextReel ? "opacity-30 cursor-not-allowed" : "hover:bg-white/20")}>
                    <ChevronDown className="h-8 w-8" />
                  </button>
                </div>
              )}

              {/* Video */}
              <div className="w-full max-w-[500px] h-full">
                <ReelCardSingle reel={reelWithUser} isActive={true} onLike={handleLike} onView={viewReel} className="w-full h-full md:rounded-xl overflow-hidden border border-white/10" videoRef={videoRef} isPlaying={isPlaying} setIsPlaying={setIsPlaying} isStandalone={true} />
              </div>

              {/* RTL: Nav Arrows on RIGHT of video, LTR: Action Buttons on RIGHT */}
              {isRtl ? (
                <div className="flex flex-col gap-4">
                  <button onClick={goToPrev} disabled={!prevReel} className={cn("w-12 h-12 rounded-full flex items-center justify-center bg-white/10 text-white backdrop-blur-md transition-all", !prevReel ? "opacity-30 cursor-not-allowed" : "hover:bg-white/20")}>
                    <ChevronUp className="h-8 w-8" />
                  </button>
                  <button onClick={goToNext} disabled={!nextReel} className={cn("w-12 h-12 rounded-full flex items-center justify-center bg-white/10 text-white backdrop-blur-md transition-all", !nextReel ? "opacity-30 cursor-not-allowed" : "hover:bg-white/20")}>
                    <ChevronDown className="h-8 w-8" />
                  </button>
                </div>
              ) : <ActionButtons size="desktop" />}
            </div>
          </div>

          {/* Comments Panel - Absolute positioned, slides over video */}
          {isCommentsOpen && (
            <div className={cn(
              "absolute top-0 h-full w-[400px] bg-black/95 border-white/10 overflow-hidden flex flex-col z-50 shadow-2xl",
              "animate-in duration-300",
              isRtl ? "left-0 slide-in-from-left border-r" : "right-0 slide-in-from-right border-l"
            )}>
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-white text-xl font-bold text-center">{isRtl ? "التعلقيات" : "Comments"}</h2>
                  <p className="text-white/60 text-sm text-center mt-1">{reelWithUser.comments} {isRtl ? "تعليق" : "comments"}</p>
                </div>
                <button onClick={() => setIsCommentsOpen(false)} className="text-white/60 hover:text-white transition-colors">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <ReelCommentsSection reelId={reelWithUser.id} />
              </div>
            </div>
          )}
        </div>

        {/* Mobile Layout - TikTok Style */}
        <div className="md:hidden h-full">
          <div className="h-full relative">
            {/* Full Screen Video */}
            <ReelCardSingle 
              reel={reelWithUser} 
              isActive={true} 
              onLike={handleLike} 
              onView={viewReel} 
              className="w-full h-full overflow-hidden" 
              videoRef={videoRef} 
              isPlaying={isPlaying} 
              setIsPlaying={setIsPlaying} 
              isStandalone={true} 
            />

            {/* Action Buttons - Overlaid on video */}
            <div className={cn(
              "absolute top-1/2 -translate-y-1/2 flex flex-col items-center gap-5 z-20 drop-shadow-lg",
              isRtl ? "left-3" : "right-3"
            )}>
              {/* Follow Button */}
              <button 
                onClick={() => { if (!isAuthenticated) { toast.error(isRtl ? "يجب تسجيل الدخول أولاً" : "Please login first"); return; } toast.success(isRtl ? "تم متابعة المستخدم" : "Following user"); }}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="relative">
                  <Avatar className="h-11 w-11 border-2 border-white">
                    <AvatarImage src={reelWithUser.user.avatar} alt={reelWithUser.user.displayName} />
                    <AvatarFallback>{reelWithUser.user.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-black">
                    <span className="text-white text-xs font-bold">+</span>
                  </div>
                </div>
              </button>

              {/* Play/Pause Button */}
              <button onClick={() => setIsPlaying(!isPlaying)} className="flex flex-col items-center gap-1 group">
                <div className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10">
                  {isPlaying ? <Pause className="h-8 w-8 text-white" /> : <Play className="h-8 w-8 text-white fill-white" />}
                </div>
                <span className="text-white text-xs font-semibold drop-shadow-lg">{isPlaying ? (isRtl ? "إيقاف" : "Pause") : (isRtl ? "تشغيل" : "Play")}</span>
              </button>

              {/* Like Button */}
              <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
                <div className="w-11 h-11 rounded-full flex items-center justify-center transition-all">
                  <Heart className={cn("h-8 w-8", isLiked ? "fill-red-500 text-red-500" : "text-white")} />
                </div>
                <span className="text-white text-xs font-semibold drop-shadow-lg">{reelWithUser.likes}</span>
              </button>

              {/* Comment Button */}
              <button onClick={() => setIsCommentsOpen(true)} className="flex flex-col items-center gap-1 group">
                <div className="w-11 h-11 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <span className="text-white text-xs font-semibold drop-shadow-lg">{reelWithUser.comments}</span>
              </button>

              {/* Share Button */}
              <button onClick={() => setIsShareModalOpen(true)} className="flex flex-col items-center gap-1 group">
                <div className="w-11 h-11 rounded-full flex items-center justify-center">
                  <Share2 className="h-8 w-8 text-white" />
                </div>
              </button>

              {/* More Options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-11 h-11 rounded-full flex items-center justify-center">
                    <MoreVertical className="h-7 w-7 text-white" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-48 bg-black/90 border-white/10 text-white">
                  {user?.id === reelWithUser.user.id ? (
                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => setIsDeleteDialogOpen(true)}>
                      <Trash className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                      {isRtl ? "حذف الريل" : "Delete Reel"}
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => setIsReportDialogOpen(true)} className="focus:bg-white/10">
                      <Flag className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                      {isRtl ? "الإبلاغ عن الريل" : "Report Reel"}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-white/10" />
                  {[1, 1.5, 2].map(speed => (
                    <DropdownMenuItem key={speed} onClick={() => setPlaybackSpeed(speed)} className="flex justify-between items-center focus:bg-white/10">
                      <span>{isRtl ? `السرعة ${speed}x` : `Speed ${speed}x`}</span>
                      {playbackSpeed === speed && <Check className="h-4 w-4 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={() => setAutoAdvance(!autoAdvance)} className="flex justify-between items-center focus:bg-white/10 cursor-pointer">
                    <span>{isRtl ? "التمرير التلقائي" : "Auto-advance"}</span>
                    {autoAdvance && <Check className="h-4 w-4 text-primary" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Back Button - Top */}
            <button 
              onClick={() => navigate(-1)} 
              className={cn(
                "absolute top-20 z-20 w-10 h-10 rounded-full flex items-center justify-center bg-black/30 text-white",
                isRtl ? "right-3" : "left-3"
              )}
            >
              {isRtl ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
            </button>

          </div>

          {/* Comments Modal - Mobile only */}
          {isMobile && (
            <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
              <DialogContent className="sm:max-w-full h-[80vh] bg-black/95 border-t border-white/10 rounded-t-xl">
                <ReelCommentsSection reelId={reelWithUser.id} />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Share Modal */}
        <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} url={`${window.location.origin}/reel/${reelWithUser.id}`} title={reelWithUser.caption || `Reel by ${reelWithUser.user.displayName}`} description={`Check out this reel by ${reelWithUser.user.displayName}`} type="reel" author={reelWithUser.user} image={reelWithUser.thumbnail_url} />

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="bg-black/90 border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className={isRtl ? "text-right" : "text-left"}>{isRtl ? "حذف الريل" : "Delete Reel"}</DialogTitle>
              <DialogDescription className={cn("mt-2", isRtl ? "text-right" : "text-left")}>
                {isRtl ? "هل أنت متأكد من حذف هذا الريل؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to delete this reel? This action cannot be undone."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6 gap-2">
              <DialogClose asChild>
                <Button variant="outline" className="bg-white/10 border-white/10 text-white hover:bg-white/20">{isRtl ? "إلغاء" : "Cancel"}</Button>
              </DialogClose>
              <Button variant="destructive" onClick={handleDeleteReel} disabled={isSubmitting}>
                {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (isRtl ? "حذف" : "Delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Report Dialog */}
        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
          <DialogContent className="bg-black/90 border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className={isRtl ? "text-right" : "text-left"}>{isRtl ? "الإبلاغ عن ريل" : "Report Reel"}</DialogTitle>
              <DialogDescription className={cn("mt-2", isRtl ? "text-right" : "text-left")}>
                {isRtl ? "يرجى تقديم سبب للإبلاغ عن هذا الريل." : "Please provide a reason for reporting this reel."}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <select className="w-full border rounded p-2 mb-2 bg-black/50 border-white/10 text-white" value={reportReason} onChange={e => setReportReason(e.target.value)} disabled={isSubmitting}>
                <option value="">{isRtl ? "اختر سبب الإبلاغ..." : "Select a reason..."}</option>
                <option value="spam">{isRtl ? "الريل غير صالح" : "Reel is inappropriate"}</option>
                <option value="harassment">{isRtl ? "الريل يشكل ضغطاً" : "Reel is harassing"}</option>
                <option value="violence">{isRtl ? "الريل يشكل خطراً" : "Reel is threatening"}</option>
                <option value="other">{isRtl ? "أخرى" : "Other"}</option>
              </select>
            </div>
            <DialogFooter className="mt-6 gap-2">
              <DialogClose asChild>
                <Button variant="outline" className="bg-white/10 border-white/10 text-white hover:bg-white/20">{isRtl ? "إلغاء" : "Cancel"}</Button>
              </DialogClose>
              <Button variant="destructive" onClick={handleReportReel} disabled={isSubmitting || !reportReason.trim()}>
                {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (isRtl ? "إبلاغ" : "Report")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

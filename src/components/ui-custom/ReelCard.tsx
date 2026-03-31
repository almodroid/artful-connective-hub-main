import React, { useState, useRef, useEffect, memo, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Play, Pause, Volume2, VolumeX, Link as LinkIcon, MoreVertical, Flag, Trash, Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { FormattedText } from "./FormattedText";
import { useTranslation } from "@/hooks/use-translation";
import { ReelWithUser, useReels } from "@/hooks/use-reels";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ReelCardProps {
  reel: ReelWithUser;
  onLike?: (reelId: string) => void;
  onView?: (reelId: string) => void;
  isActive?: boolean;
  onDelete?: () => void;
  className?: string;
}

/**
 * ReelCard - Optimized grid-view component for Reels
 * Follows best practices for performance and UX in a grid layout.
 */
export const ReelCard = memo(({ 
  reel, 
  onLike, 
  onView, 
  isActive = false, 
  onDelete, 
  className 
}: ReelCardProps) => {
  const { isAuthenticated, user } = useAuth();
  const { isRtl, t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { deleteReel, reportReel } = useReels();

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const isOwner = useMemo(() => isAuthenticated && user?.id === reel.user.id, [isAuthenticated, user?.id, reel.user.id]);

  // Video Event Handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => { setIsLoading(true); setHasError(false); };
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => { setIsLoading(false); setHasError(true); };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, []);

  // Playback Logic
  useEffect(() => {
    if (!videoRef.current) return;
    
    if (isActive && isPlaying) {
      videoRef.current.play().catch(() => setIsPlaying(false));
    } else {
      videoRef.current.pause();
    }
  }, [isActive, isPlaying]);

  const togglePlayback = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        if (onView) onView(reel.id);
      }).catch(() => {
        videoRef.current!.muted = true;
        setIsMuted(true);
        videoRef.current!.play().then(() => setIsPlaying(true));
      });
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Actions
  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      if (await deleteReel(reel.id)) {
        setIsDeleteDialogOpen(false);
        if (onDelete) onDelete();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    setIsSubmitting(true);
    try {
      if (await reportReel(reel.id, reportReason)) {
        setIsReportDialogOpen(false);
        setReportReason("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCardClick = () => {
    navigate(`/reel/${reel.id}`);
  };

  return (
    <Card 
      className={cn(
        "group overflow-hidden border-none bg-card/50 flex flex-col h-full transition-all duration-300 hover:shadow-xl", 
        className
      )}
    >
      {/* Header - Minimal info outside canvas */}
      <div className="flex items-center justify-between p-2 bg-background/80 backdrop-blur-sm border-b border-border/10">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-6 w-6 ring-1 ring-primary/20">
            <AvatarImage src={reel.user.avatar} alt={reel.user.displayName} />
            <AvatarFallback className="text-[10px]">{reel.user.displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium truncate opacity-80 hover:opacity-100 transition-opacity">
            {reel.user.displayName}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-primary/10">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {isOwner ? (
              <DropdownMenuItem 
                className="text-destructive focus:bg-destructive/10" 
                onClick={(e) => { e.stopPropagation(); setIsDeleteDialogOpen(true); }}
              >
                <Trash className="h-3.5 w-3.5 mr-2" />
                {t('delete') || 'Delete'}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsReportDialogOpen(true); }}>
                <Flag className="h-3.5 w-3.5 mr-2" />
                {t('report') || 'Report'}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Media Content */}
      <CardContent 
        className="p-0 relative flex-1 bg-black cursor-pointer overflow-hidden group/video"
        onClick={handleCardClick}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/20 animate-pulse">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white/60">
            <span className="text-xs mb-2">{isRtl ? "فشل التحميل" : "Load failed"}</span>
            <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => videoRef.current?.load()}>
              {isRtl ? "إعادة" : "Retry"}
            </Button>
          </div>
        ) : (
          <video
            ref={videoRef}
            src={reel.video_url}
            className="w-full h-full object-cover"
            loop
            playsInline
            muted={isMuted}
            poster={reel.thumbnail_url}
          />
        )}

        {/* Overlays */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/video:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md text-white scale-90 group-hover/video:scale-100 transition-transform"
            onClick={togglePlayback}
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 fill-current" />}
          </Button>
        </div>

        {/* View Count Overlay */}
        <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-sm text-[10px] text-white/90 font-medium">
          {reel.views} {isRtl ? "مشاهدة" : "views"}
        </div>
      </CardContent>

      {/* Footer - Controls outside canvas */}
      <CardFooter className="p-2 flex flex-col gap-2 bg-background/80 backdrop-blur-sm border-t border-border/10">
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-1.5">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-full hover:bg-primary/10"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-full hover:bg-primary/10"
              asChild
            >
              <Link to={`/reel/${reel.id}`} onClick={(e) => e.stopPropagation()}>
                <LinkIcon className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
            <Heart className={cn("h-3 w-3", reel.isLiked && "fill-primary text-primary")} />
            {reel.likes}
          </div>
        </div>

        {reel.caption && (
          <div className="w-full text-[11px] leading-snug line-clamp-1 opacity-70 px-1">
            <FormattedText text={reel.caption} />
          </div>
        )}
      </CardFooter>

      {/* Dialogs - Conditional rendering for performance */}
      {isDeleteDialogOpen && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className={isRtl ? "text-right" : ""}>{isRtl ? "حذف الريل" : "Delete Reel"}</DialogTitle>
              <DialogDescription className={isRtl ? "text-right" : ""}>
                {isRtl ? "هل أنت متأكد؟ لا يمكن التراجع." : "Are you sure? This cannot be undone."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2">
              <DialogClose asChild><Button variant="outline">{isRtl ? "إلغاء" : "Cancel"}</Button></DialogClose>
              <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                {isSubmitting ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isRtl ? "حذف" : "Delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isReportDialogOpen && (
        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>{isRtl ? "إبلاغ" : "Report"}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <select 
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              >
                <option value="">{isRtl ? "اختر السبب..." : "Select reason..."}</option>
                <option value="spam">Spam</option>
                <option value="inappropriate">Inappropriate</option>
                <option value="harassment">Harassment</option>
              </select>
            </div>
            <DialogFooter>
              <Button variant="destructive" onClick={handleReport} disabled={isSubmitting || !reportReason}>
                {isRtl ? "إبلاغ" : "Report"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
});

ReelCard.displayName = "ReelCard";

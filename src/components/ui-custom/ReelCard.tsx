import { useState, useRef, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Heart, MessageCircle, Share2, Play, Pause, Volume2, VolumeX, Link as LinkIcon, MoreVertical, Flag, Trash } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { FormattedText } from "./FormattedText";
import { useNotificationsApi } from "@/hooks/use-notifications-api";
import { useTranslation } from "@/hooks/use-translation";
import { ReelWithUser, useReels } from "@/hooks/use-reels";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ShareModal } from "./ShareModal";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { TablesInsert } from '@/integrations/supabase/types';

// Define an interface for animated hearts
interface AnimatedHeart {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  opacity: number;
  rotation: number;
}

interface ReelCardProps {
  reel: ReelWithUser;
  onLike?: (reelId: string) => void;
  onView?: (reelId: string) => void;
  isActive?: boolean;
  onDelete?: () => void; // Callback for after deletion
  className?: string;
}

export function ReelCard({ reel, onLike, onView, isActive = false, onDelete, className }: ReelCardProps) {
  const { isAuthenticated, user } = useAuth();
  const { isRtl, t } = useTranslation();
  const location = useLocation();
  const isSingleReelPage = location.pathname.startsWith('/reel/');
  const [isLiked, setIsLiked] = useState(reel.isLiked || false);
  const [likeCount, setLikeCount] = useState(reel.likes || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Heart animation states
  const [hearts, setHearts] = useState<AnimatedHeart[]>([]);
  const [heartCount, setHeartCount] = useState(0);
  const heartContainerRef = useRef<HTMLDivElement>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const { sendInteractionNotification } = useNotificationsApi();
  const { deleteReel } = useReels();
  
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [fallbackPoster, setFallbackPoster] = useState<string | null>(null);
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if the current user is the owner of this reel
  const isOwner = isAuthenticated && user?.id === reel.user.id;

  // Function to generate random hearts
  const generateHearts = (count: number) => {
    if (!heartContainerRef.current) return;
    
    const containerRect = heartContainerRef.current.getBoundingClientRect();
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    
    const newHearts: AnimatedHeart[] = [];
    
    for (let i = 0; i < count; i++) {
      // Create random properties for each heart
      const id = heartCount + i;
      const size = Math.random() * 20 + 10; // Size between 10-30px
      const x = centerX + (Math.random() * 40 - 20); // Spread hearts horizontally
      const y = centerY + (Math.random() * 20 - 10); // Spread hearts vertically
      const duration = Math.random() * 1.5 + 0.5; // Animation duration between 0.5-2s
      const opacity = Math.random() * 0.3 + 0.7; // Opacity between 0.7-1
      const rotation = Math.random() * 60 - 30; // Rotation between -30 and 30 degrees
      
      newHearts.push({ id, x, y, size, duration, opacity, rotation });
    }
    
    setHeartCount(prev => prev + count);
    setHearts(prev => [...prev, ...newHearts]);
    
    // Remove hearts after animation completes
    setTimeout(() => {
      setHearts(prev => prev.filter(heart => !newHearts.some(newHeart => newHeart.id === heart.id)));
    }, 2000);
  };

  // Handle video loading states
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      const handleLoadStart = () => {
        setIsLoading(true);
        setHasError(false);
      };
      
      const handleCanPlay = () => {
        setIsLoading(false);
        setHasError(false);
      };
      
      const handleError = () => {
        setIsLoading(false);
        setHasError(true);
      };
      
      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);
      
      return () => {
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
      };
    }
  }, []);

  // Handle video playback
  useEffect(() => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    
    if (isActive) {
      // Only set initial state, don't auto-play
      setIsPlaying(false);
      video.pause();
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  // On mobile, if video is loading for more than 1.5s, show a random frame as poster
  useEffect(() => {
    if (!isMobile) return;
    if (isLoading && !fallbackPoster) {
      fallbackTimeoutRef.current = setTimeout(() => {
        // Try to extract a random frame from the video
        if (videoRef.current) {
          const video = videoRef.current;
          // Create a hidden video element to seek and capture frame
          const tempVideo = document.createElement('video');
          tempVideo.src = video.src;
          tempVideo.crossOrigin = 'anonymous';
          tempVideo.muted = true;
          tempVideo.currentTime = Math.random() * (video.duration || 5);
          tempVideo.addEventListener('seeked', () => {
            const canvas = document.createElement('canvas');
            canvas.width = tempVideo.videoWidth;
            canvas.height = tempVideo.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
              setFallbackPoster(canvas.toDataURL('image/png'));
            }
          }, { once: true });
        }
      }, 1500);
    } else if (!isLoading && fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
    return () => {
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }
    };
  }, [isLoading, isMobile, fallbackPoster]);

  // Handle manual playback toggle
  const togglePlayback = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        if (onView && !isPlaying) {
          onView(reel.id);
        }
      }).catch(error => {
        console.error("Error playing video:", error);
        // If playback fails, try playing muted
        if (videoRef.current) {
          videoRef.current.muted = true;
          setIsMuted(true);
          videoRef.current.play().catch(e => {
            console.error("Error playing muted video:", e);
          });
        }
      });
    }
  };
  
  // Handle mute/unmute
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };
  
  const handleLike = () => {
    if (!isAuthenticated) {
      toast.error(isRtl ? "يجب تسجيل الدخول أولاً" : "You must be logged in");
      return;
    }
    
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    
    if (newLikedState) {
      // Only send notification and show animation when liking, not unliking
      sendInteractionNotification(reel.user.id, "like", reel.id, "reel");
      generateHearts(5 + Math.floor(Math.random() * 3)); // Generate 5-7 hearts
    }
    
    if (onLike) {
      onLike(reel.id);
    }
  };
  
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const { reportReel } = useReels();

  const handleReportReel = async () => {
    if (!reportReason.trim()) {
      toast.error(t('reportReasonRequired'));
      return;
    }
    setIsSubmitting(true);
    try {
      const success = await reportReel(reel.id, reportReason);
      if (success) {
        setIsReportDialogOpen(false);
        setReportReason("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReel = async () => {
    if (!isAuthenticated || !isOwner) return;
    
    setIsSubmitting(true);
    try {
      const success = await deleteReel(reel.id);
      if (success) {
        setIsDeleteDialogOpen(false);
        if (onDelete) onDelete();
        
        // If we're on the single reel page, navigate back
        if (isSingleReelPage) {
          window.history.back();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unified report function for reels
  const reportReelUnified = async (reelId: string, reason: string): Promise<boolean> => {
    if (!isAuthenticated || !user) {
      toast.error(t('report') + ': ' + (isRtl ? "يجب تسجيل الدخول للإبلاغ عن ريل" : "You must be logged in to report a reel"));
      return false;
    }
    if (!reason.trim()) {
      toast.error(t('report') + ': ' + t('reportReason'));
      return false;
    }
    try {
      // Check if the user has already reported this reel
      const { data: existingReport, error: checkError } = await supabase
        .from("reports")
        .select()
        .eq("content_type", "reel")
        .eq("content_id", reelId)
        .eq("reporter_id", user.id)
        .maybeSingle();
      if (checkError) {
        console.error("Error checking existing report:", checkError);
        toast.error(t('report') + ': ' + (isRtl ? "تعذر التحقق من حالة البلاغ" : "Could not check report status"));
        return false;
      }
      if (existingReport) {
        toast.info(t('alreadyReported'));
        return false;
      }
      // Create a report
      const reportPayload: TablesInsert<'reports'> = {
        reporter_id: user.id,
        reported_id: reel.user.id,
        content_type: "reel",
        content_id: reelId,
        reason: reason.trim(),
        status: "pending"
      };
      const { error: reportError } = await supabase
        .from("reports")
        .insert(reportPayload);
      if (reportError) {
        console.error("Error reporting reel:", reportError);
        toast.error(t('report') + ': ' + (isRtl ? "فشل الإبلاغ عن الريل" : "Failed to report reel"));
        return false;
      }
      toast.success(t('reportSuccess'));
      return true;
    } catch (error) {
      console.error("Error in reportReel:", error);
      toast.error(t('report') + ': ' + (isRtl ? "حدث خطأ ما. يرجى المحاولة مرة أخرى." : "Something went wrong. Please try again."));
      return false;
    }
  };
  
  const handleShare = () => {
    const shareTitle = `${isRtl ? "ريل بواسطة" : "Reel by"} ${reel.user.displayName}`;
    const shareText = `${reel.caption?.substring(0, 100) || ''}${reel.caption && reel.caption.length > 100 ? '...' : ''}\n\n${isRtl ? "مشاركة من" : "Shared from"} ${window.location.host}`;
    const shareUrl = `${window.location.origin}/reel/${reel.id}?utm_source=share&utm_medium=social&utm_campaign=reel_share&publisher=${reel.user.username}`;
    
    // Create a share dialog
    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      }).then(() => {
        sendInteractionNotification(reel.user.id, "share", reel.id, "reel");
        toast.success(isRtl ? "تم المشاركة بنجاح" : "Shared successfully");
      }).catch((error) => {
        if (error.name !== 'AbortError') {
          // Fallback if sharing failed (but not if user cancelled)
          copyToClipboard(shareUrl, shareTitle, shareText);
        }
      });
    } else {
      // For browsers that don't support sharing
      copyToClipboard(shareUrl, shareTitle, shareText);
    }
  };
  
  const copyToClipboard = (url: string, title: string, text: string) => {
    // Create a formatted text with credit
    const formattedText = `${title}\n${text}\n${url}`;
    
    // Try to copy rich text if supported
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(formattedText)
        .then(() => {
          toast.success(isRtl ? "تم نسخ الرابط مع المعلومات إلى الحافظة" : "Link with credit copied to clipboard");
          sendInteractionNotification(reel.user.id, "share", reel.id, "reel");
        })
        .catch(() => {
          // Fallback to document.execCommand
          fallbackCopy(url);
        });
    } else {
      fallbackCopy(url);
    }
  };
  
  const fallbackCopy = (text: string) => {
    // Old method for browsers not supporting clipboard API
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      toast.success(isRtl ? "تم نسخ الرابط إلى الحافظة" : "Link copied to clipboard");
      sendInteractionNotification(reel.user.id, "share", reel.id, "reel");
    } catch (err) {
      toast.error(isRtl ? "فشل نسخ الرابط" : "Failed to copy link");
    }
    
    document.body.removeChild(textArea);
  };

  // Helper function to handle different date formats
  const getFormattedDate = () => {
    if (reel.createdAt instanceof Date) {
      return formatDistanceToNow(reel.createdAt, { 
        addSuffix: true, 
        locale: isRtl ? ar : undefined 
      });
    } else if (typeof reel.createdAt === 'string') {
      return formatDistanceToNow(new Date(reel.createdAt), { 
        addSuffix: true, 
        locale: isRtl ? ar : undefined 
      });
    }
    return "";
  };

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Add a click handler for mobile full-card navigation
  const handleCardClick = (e: React.MouseEvent) => {
    if (!isMobile) return;
    // Prevent navigation if clicking on interactive elements
    if (
      e.target instanceof HTMLElement &&
      (e.target.closest('button') || e.target.closest('a') || e.target.closest('input'))
    ) {
      return;
    }
    navigate(`/reel/${reel.id}`);
  };

  return (
    <Card
      className={cn("overflow-hidden border-border/40 bg-card/30 animate-scale-in hover:shadow-md transition-shadow duration-300 h-full", className)}
      onClick={handleCardClick}
      style={isMobile ? { cursor: 'pointer' } : {}}
    >
      <CardContent className="p-0 relative h-full">
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-white/50">
              <AvatarImage src={reel.user.avatar} alt={reel.user.displayName} />
              <AvatarFallback>{reel.user.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <Link 
                  to={`/profile/${reel.user.username}`}
                  className="font-medium text-white hover:text-primary transition-colors"
                >
                  {reel.user.displayName}
                </Link>
                <div className="flex items-center gap-2">

                  
                  {/* More Options Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-8 rounded-full text-white/80 hover:text-white hover:bg-black/20"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {isOwner ? (
                        <DropdownMenuItem 
                          className="text-destructive" 
                          onClick={() => setIsDeleteDialogOpen(true)}
                          dir={isRtl ? "rtl" : "ltr"}
                        >
                          <Trash className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                          {isRtl ? "حذف الريل" : "Delete Reel"}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          onClick={() => setIsReportDialogOpen(true)}
                          dir={isRtl ? "rtl" : "ltr"}
                        >
                          <Flag className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                          {isRtl ? "الإبلاغ عن الريل" : "Report Reel"}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <Link 
                to={`/profile/${reel.user.username}`}
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                
              </Link>
            </div>
          </div>
        </div>
        
        <div className="relative bg-black h-full">
          {isLoading && isMobile && fallbackPoster ? (
            <img src={fallbackPoster} alt="Video frame" className="absolute inset-0 w-full h-full object-cover" />
          ) : isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : null}
          
          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4 text-center">
              <p className="text-sm mb-2">{isRtl ? "حدث خطأ في تحميل الفيديو" : "Error loading video"}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-white border-white hover:bg-white/10"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.load();
                  }
                }}
              >
                {isRtl ? "إعادة المحاولة" : "Retry"}
              </Button>
            </div>
          )}
          
          <video 
            ref={videoRef}
            src={reel.video_url} 
            className="w-full h-full object-cover cursor-pointer"
            loop
            playsInline
            muted={isMuted}
            poster={fallbackPoster || reel.thumbnail_url}
            onClick={togglePlayback}
            onTouchEnd={togglePlayback}
          />
          
          {/* Hearts animation container */}
          <div 
            ref={heartContainerRef}
            className="absolute inset-0 pointer-events-none overflow-hidden"
          >
            {hearts.map((heart) => (
              <div
                key={heart.id}
                className="absolute text-primary fill-primary"
                style={{
                  left: `${heart.x}px`,
                  top: `${heart.y}px`,
                  width: `${heart.size}px`,
                  height: `${heart.size}px`,
                  opacity: heart.opacity,
                  transform: `rotate(${heart.rotation}deg) scale(0)`,
                  animation: `float-up ${heart.duration}s ease-out forwards, 
                              scale-in-out ${heart.duration * 0.5}s ease-in-out forwards`
                }}
              >
                <Heart className="w-full h-full fill-inherit" />
              </div>
            ))}
          </div>
          
          {/* Bottom video controls */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent flex justify-between items-center video-controls">
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-full bg-black/50 text-white hover:bg-black/70"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              
              {!isSingleReelPage && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-black/50 text-white hover:bg-black/70 reel-link"
                  asChild
                >
                  <Link 
                    to={`/reel/${reel.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (videoRef.current) {
                        videoRef.current.pause();
                        setIsPlaying(false);
                      }
                    }}
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
            
            <div className="text-sm text-white/90">
              {reel.views} {isRtl ? "مشاهدة" : "views"}
            </div>
          </div>
        </div>
        
        {/* Caption below video */}
        {reel.caption && (
          <div className="p-4 pt-3 text-sm leading-relaxed text-foreground">
            <FormattedText text={reel.caption} />
          </div>
        )}
        
        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className={isRtl ? "text-right" : "text-left"}>{isRtl ? "حذف الريل" : "Delete Reel"}</DialogTitle>
              <DialogDescription className={isRtl ? "text-right" : "text-left"}>
                {isRtl ? "هل أنت متأكد من حذف هذا الريل؟ لا يمكن التراجع عن هذا الإجراء." : 
                "Are you sure you want to delete this reel? This action cannot be undone."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline">
                  {isRtl ? "إلغاء" : "Cancel"}
                </Button>
              </DialogClose>
              <Button 
                variant="destructive" 
                onClick={handleDeleteReel}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  isRtl ? "حذف" : "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Report Dialog */}
        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRtl ? "الإبلاغ عن ريل" : "Report Reel"}</DialogTitle>
              <DialogDescription>
                {isRtl ? "يرجى تقديم سبب للإبلاغ عن هذا الريل. سيراجع فريقنا الإبلاغ." : 
                "Please provide a reason for reporting this reel. Our team will review the report."}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <select
                className="w-full border rounded p-2 mb-2 dark:bg-muted dark:text-foreground dark:border-muted"
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">{isRtl ? "اختر سبب الإبلاغ..." : "Select a reason for reporting..."}</option>
                <option value="spam">Spam</option>
                <option value="inappropriate">Inappropriate Content</option>
                <option value="harassment">Harassment</option>
                <option value="other">{isRtl ? "آخر" : "Other"}</option>
              </select>
              {reportReason === "other" && (
                <textarea
                  className="w-full border rounded p-2 mb-2 dark:bg-muted dark:text-foreground dark:border-muted"
                  placeholder={isRtl ? "يرجى توضيح السبب..." : "Please specify..."}
                  value={reportReason === "other" ? reportReason : ""}
                  onChange={e => setReportReason(e.target.value)}
                  disabled={isSubmitting}
                />
              )}
            </div>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline">
                  {isRtl ? "إلغاء" : "Cancel"}
                </Button>
              </DialogClose>
              <Button 
                variant="destructive" 
                onClick={handleReportReel}
                disabled={isSubmitting || !reportReason.trim()}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  isRtl ? "إبلاغ" : "Report"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>

      {/* Style for animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float-up {
          0% {
            transform: translate(0, 0) rotate(${Math.random() * 20 - 10}deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(${Math.random() * 50 - 25}px, -100px) rotate(${Math.random() * 40 - 20}deg) scale(0.5);
            opacity: 0;
          }
        }
        
        @keyframes scale-in-out {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
      `}} />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        url={`${window.location.origin}/reel/${reel.id}`}
        title={reel.caption || `Reel by ${reel.user.displayName}`}
        description={`Check out this reel by ${reel.user.displayName}`}
        type="reel"
        author={reel.user}
        image={reel.thumbnail_url}
      />
    </Card>
  );
}
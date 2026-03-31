import React, { useState, useRef, useEffect, memo, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormattedText } from "./FormattedText";
import { useTranslation } from "@/hooks/use-translation";
import { ReelWithUser } from "@/hooks/use-reels";
import { cn } from "@/lib/utils";

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
  reel: ReelWithUser & {
    nextReelId?: string;
  };
  onLike?: (reelId: string) => void;
  onView?: (reelId: string) => void;
  isActive?: boolean;
  className?: string;
  videoRef?: React.RefObject<HTMLVideoElement>;
  isPlaying?: boolean;
  setIsPlaying?: (isPlaying: boolean) => void;
  isStandalone?: boolean;
}

/**
 * ReelCardSingle - High-performance single-reel view component
 * Optimized for full-screen or detail view display with best practices.
 */
export const ReelCardSingle = memo(({ 
  reel, 
  onLike, 
  onView, 
  isActive = false, 
  className,
  videoRef: externalVideoRef,
  isPlaying = false,
  setIsPlaying,
  isStandalone = true
}: ReelCardProps) => {
  const { isRtl } = useTranslation();
  
  // State
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Heart animation states
  const [hearts, setHearts] = useState<AnimatedHeart[]>([]);
  const [heartCount, setHeartCount] = useState(0);
  const heartContainerRef = useRef<HTMLDivElement>(null);
  
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalVideoRef || internalVideoRef;

  // Optimized heart generation
  const generateHearts = useCallback((count: number) => {
    if (!heartContainerRef.current) return;
    const containerRect = heartContainerRef.current.getBoundingClientRect();
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    const newHearts: AnimatedHeart[] = [];
    for (let i = 0; i < count; i++) {
      const id = Date.now() + i;
      const size = Math.random() * 20 + 10;
      const x = centerX + (Math.random() * 40 - 20);
      const y = centerY + (Math.random() * 20 - 10);
      const duration = Math.random() * 1.5 + 0.5;
      const opacity = Math.random() * 0.3 + 0.7;
      const rotation = Math.random() * 60 - 30;
      newHearts.push({ id, x, y, size, duration, opacity, rotation });
    }
    setHeartCount(prev => prev + count);
    setHearts(prev => [...prev, ...newHearts]);
    setTimeout(() => {
      setHearts(prev => prev.filter(heart => !newHearts.some(newHeart => newHeart.id === heart.id)));
    }, 2000);
  }, []);

  // Video Event Handlers - Defined once with useCallback
  const handleLoadStart = useCallback(() => { setIsLoading(true); setHasError(false); }, []);
  const handleCanPlay = useCallback(() => setIsLoading(false), []);
  const handleError = useCallback(() => { setIsLoading(false); setHasError(true); }, []);
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  }, [videoRef]);
  const handleDurationChange = useCallback(() => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  }, [videoRef]);
  const handlePlaying = useCallback(() => setIsLoading(false), []);
  const handleWaiting = useCallback(() => setIsLoading(true), []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('waiting', handleWaiting);
    
    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('waiting', handleWaiting);
    };
  }, [videoRef, handleLoadStart, handleCanPlay, handleError, handleTimeUpdate, handleDurationChange, handlePlaying, handleWaiting]);

  // Sync playback with isActive and isPlaying props
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const isVideoPlaying = !video.paused && !video.ended;
    
    if (isActive && isPlaying && !isVideoPlaying) {
      video.play().catch(error => {
        console.error("Playback error:", error);
        if (setIsPlaying) setIsPlaying(false);
      });
    } else if (!isPlaying && isVideoPlaying) {
      video.pause();
    }
  }, [isActive, isPlaying]);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused) {
      video.play().then(() => {
        if (setIsPlaying) setIsPlaying(true);
        if (onView) onView(reel.id);
      }).catch(console.error);
    } else {
      video.pause();
      if (setIsPlaying) setIsPlaying(false);
    }
  }, [videoRef, setIsPlaying, onView, reel.id]);
  
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted, videoRef]);
  
  const handleLikeAction = useCallback(() => {
    generateHearts(5 + Math.floor(Math.random() * 3));
    if (onLike) onLike(reel.id);
  }, [generateHearts, onLike, reel.id]);
  
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  }, [videoRef]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn("flex flex-col h-full bg-black overflow-hidden", className)}>
      {/* Video Container */}
      <div className="relative flex-1 flex items-center justify-center bg-black group">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-6 text-center z-10">
            <p className="text-sm mb-4 opacity-80">{isRtl ? "فشل تحميل الفيديو" : "Video failed to load"}</p>
            <Button variant="outline" size="sm" onClick={() => videoRef.current?.load()}>
              {isRtl ? "إعادة المحاولة" : "Retry"}
            </Button>
          </div>
        )}
        
        <video 
          ref={videoRef}
          src={reel.video_url} 
          className="max-w-full max-h-full object-contain cursor-pointer relative z-0"
          playsInline
          autoPlay={isActive && isPlaying}
          muted={isMuted}
          poster={reel.thumbnail_url}
          onClick={togglePlayback}
          loop
        />
        
        {/* Animated Hearts Container */}
        <div ref={heartContainerRef} className="absolute inset-0 pointer-events-none overflow-hidden">
          {hearts.map((heart) => (
            <div
              key={heart.id}
              className="absolute text-primary fill-primary"
              style={{
                left: `${heart.x}px`, top: `${heart.y}px`, width: `${heart.size}px`, height: `${heart.size}px`,
                opacity: heart.opacity, transform: `rotate(${heart.rotation}deg) scale(0)`,
                animation: `float-up ${heart.duration}s ease-out forwards, scale-in-out ${heart.duration * 0.5}s ease-in-out forwards`
              }}
            >
              <Heart className="w-full h-full fill-inherit" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Controls & Info - Outside Canvas */}
      <div className="z-20 p-4 bg-background border-t border-border/10">
        {reel.caption && (
          <div className={cn("mb-4 text-sm leading-relaxed", isRtl ? "text-right" : "text-left")}>
            <FormattedText text={reel.caption} />
          </div>
        )}

        {isStandalone && (
          <div className="flex flex-col gap-3">
            {/* Progress */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] tabular-nums text-muted-foreground w-8">{formatTime(currentTime)}</span>
              <input
                type="range" min={0} max={duration || 0} value={currentTime}
                step="0.1"
                onChange={handleSeek} className="video-progress flex-1 h-1 bg-muted rounded-full appearance-none cursor-pointer"
              />
              <span className="text-[10px] tabular-nums text-muted-foreground w-8">{formatTime(duration)}</span>
            </div>
            
            {/* Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20" onClick={togglePlayback}>
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
              </div>
              <div className="text-[11px] font-medium text-muted-foreground">
                {reel.views} {isRtl ? "مشاهدة" : "views"}
              </div>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float-up {
          0% { transform: translate(0, 0) rotate(${Math.random() * 20 - 10}deg) scale(1); opacity: 1; }
          100% { transform: translate(${Math.random() * 50 - 25}px, -100px) rotate(${Math.random() * 40 - 20}deg) scale(0.5); opacity: 0; }
        }
        @keyframes scale-in-out {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .video-progress::-webkit-slider-thumb { appearance: none; width: 10px; height: 10px; background: hsl(var(--primary)); border-radius: 50%; }
      `}} />
    </div>
  );
});

ReelCardSingle.displayName = "ReelCardSingle";

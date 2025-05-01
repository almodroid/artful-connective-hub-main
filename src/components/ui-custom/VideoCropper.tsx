import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useTranslation } from "@/hooks/use-translation";
import { Crop, RotateCcw, ArrowLeftRight, ArrowUpDown, Sparkles, Sun, Moon, Layers } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface VideoCropperProps {
  videoSrc: string;
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
}

// Define filter types
type FilterType = 
  | "none" 
  | "warm" 
  | "cool" 
  | "grayscale" 
  | "sepia" 
  | "vintage" 
  | "dramatic" 
  | "clarity"
  | "fade"
  | "vivid";

// Define filter CSS values
const filterValues: Record<FilterType, string> = {
  none: "none",
  warm: "brightness(1.1) saturate(1.1) sepia(0.2)",
  cool: "brightness(1.05) saturate(0.9) hue-rotate(10deg)",
  grayscale: "grayscale(1)",
  sepia: "sepia(0.8)",
  vintage: "sepia(0.3) contrast(1.1) saturate(1.1) brightness(0.9)",
  dramatic: "contrast(1.4) brightness(0.9) saturate(1.2)",
  clarity: "brightness(1.1) contrast(1.2) saturate(1.05)",
  fade: "brightness(1.05) saturate(0.8) opacity(0.9)",
  vivid: "brightness(1.1) contrast(1.1) saturate(1.4)"
};

export function VideoCropper({ videoSrc, onCrop, onCancel }: VideoCropperProps) {
  const { t, isRtl } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<"crop" | "filter">("crop");
  const [cropArea, setCropArea] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    scale: 1
  });
  const [videoMetadata, setVideoMetadata] = useState({
    width: 0,
    height: 0,
    duration: 0
  });
  const [currentAspectRatio, setCurrentAspectRatio] = useState(9/16); // Default 9:16 for vertical
  const [cropPreview, setCropPreview] = useState<string | null>(null);
  
  // Filter states
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("none");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  
  // Define filters with translated labels
  const filters: Array<{ type: FilterType, label: string }> = [
    { type: "none", label: isRtl ? "بدون فلتر" : "No Filter" },
    { type: "warm", label: isRtl ? "دافئ" : "Warm" },
    { type: "cool", label: isRtl ? "بارد" : "Cool" },
    { type: "grayscale", label: isRtl ? "تدرج رمادي" : "Grayscale" },
    { type: "sepia", label: isRtl ? "بني" : "Sepia" },
    { type: "vintage", label: isRtl ? "قديم" : "Vintage" },
    { type: "dramatic", label: isRtl ? "دراماتيكي" : "Dramatic" },
    { type: "clarity", label: isRtl ? "وضوح" : "Clarity" },
    { type: "fade", label: isRtl ? "باهت" : "Fade" },
    { type: "vivid", label: isRtl ? "حيوي" : "Vivid" }
  ];
  
  // Combined filter style
  const getFilterStyle = () => {
    const baseFilter = filterValues[selectedFilter];
    const customAdjustments = `brightness(${brightness/100}) contrast(${contrast/100}) saturate(${saturation/100})`;
    
    return baseFilter === "none" 
      ? customAdjustments 
      : `${baseFilter} ${customAdjustments}`;
  };
  
  // Reset filter adjustments
  const resetFilterAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };
  
  // Initialize cropper when video is loaded
  useEffect(() => {
    const video = videoRef.current;
    
    if (!video) return;
    
    const handleVideoLoaded = () => {
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      const videoDuration = video.duration;
      
      setVideoMetadata({
        width: videoWidth,
        height: videoHeight,
        duration: videoDuration
      });
      
      // Initialize default crop area
      const defaultCropWidth = videoWidth;
      const defaultCropHeight = videoWidth * (16/9); // Apply 9:16 aspect ratio
      
      setCropArea({
        x: 0,
        y: (videoHeight - defaultCropHeight) / 2, // Center vertically
        width: defaultCropWidth,
        height: defaultCropHeight,
        scale: 1
      });
      
      setIsReady(true);
      updateCropPreview();
    };
    
    video.addEventListener('loadedmetadata', handleVideoLoaded);
    
    return () => {
      video.removeEventListener('loadedmetadata', handleVideoLoaded);
    };
  }, [videoSrc]);
  
  // Handle video playback
  useEffect(() => {
    const video = videoRef.current;
    
    if (!video) return;
    
    if (isPlaying) {
      video.play();
    } else {
      video.pause();
    }
    
    // Handle autoloop
    const handleVideoEnd = () => {
      video.currentTime = 0;
      video.play();
    };
    
    video.addEventListener('ended', handleVideoEnd);
    
    return () => {
      video.removeEventListener('ended', handleVideoEnd);
    };
  }, [isPlaying]);
  
  // Update crop preview when crop area changes
  useEffect(() => {
    if (isReady) {
      updateCropPreview();
    }
  }, [cropArea, isReady, selectedFilter, brightness, contrast, saturation]);
  
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };
  
  const updateCropPreview = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas dimensions to the current aspect ratio
    const targetWidth = 320; // Preview width
    const targetHeight = targetWidth / currentAspectRatio;
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    // Draw the cropped portion of the video
    ctx.filter = getFilterStyle();
    ctx.drawImage(
      video,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      0,
      0,
      targetWidth,
      targetHeight
    );
    ctx.filter = "none";
    
    // Create a preview image
    const previewUrl = canvas.toDataURL('image/jpeg');
    setCropPreview(previewUrl);
  };
  
  const handleCropComplete = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Pause video
    video.pause();
    
    // Capture frame at current time
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = cropArea.width;
    captureCanvas.height = cropArea.height;
    
    const ctx = captureCanvas.getContext('2d');
    if (!ctx) return;
    
    // Apply filter to the cropped image
    ctx.filter = getFilterStyle();
    
    // Draw the cropped video frame to the canvas
    ctx.drawImage(
      video,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      0,
      0,
      cropArea.width,
      cropArea.height
    );
    
    // Reset filter
    ctx.filter = "none";
    
    // Convert to blob
    captureCanvas.toBlob((blob) => {
      if (blob) {
        onCrop(blob);
      }
    }, 'image/jpeg', 0.95);
  };
  
  const changeAspectRatio = (ratio: number) => {
    setCurrentAspectRatio(ratio);
    
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    // Calculate new crop area based on aspect ratio
    let newWidth, newHeight;
    
    if (ratio < 1) { // Vertical video (e.g., 9:16)
      newWidth = Math.min(videoWidth, videoHeight * ratio);
      newHeight = newWidth / ratio;
    } else { // Horizontal video (e.g., 16:9)
      newHeight = Math.min(videoHeight, videoWidth / ratio);
      newWidth = newHeight * ratio;
    }
    
    setCropArea({
      x: (videoWidth - newWidth) / 2, // Center horizontally
      y: (videoHeight - newHeight) / 2, // Center vertically
      width: newWidth,
      height: newHeight,
      scale: cropArea.scale
    });
  };
  
  // Handle crop area adjustments
  const adjustCropPosition = (direction: 'left' | 'right' | 'up' | 'down', amount: number) => {
    setCropArea(prev => {
      let newX = prev.x;
      let newY = prev.y;
      
      switch (direction) {
        case 'left':
          newX = Math.max(0, Math.min(videoMetadata.width - prev.width, prev.x - amount));
          break;
        case 'right':
          newX = Math.max(0, Math.min(videoMetadata.width - prev.width, prev.x + amount));
          break;
        case 'up':
          newY = Math.max(0, Math.min(videoMetadata.height - prev.height, prev.y - amount));
          break;
        case 'down':
          newY = Math.max(0, Math.min(videoMetadata.height - prev.height, prev.y + amount));
          break;
      }
      
      return {
        ...prev,
        x: newX,
        y: newY
      };
    });
  };
  
  const adjustScale = (newScale: number) => {
    setCropArea(prev => {
      const scaleChange = newScale / prev.scale;
      const newWidth = prev.width * scaleChange;
      const newHeight = prev.height * scaleChange;
      
      // Ensure the scale doesn't make the crop area larger than the video
      if (newWidth > videoMetadata.width || newHeight > videoMetadata.height) {
        return prev;
      }
      
      // Adjust position to maintain center point
      const centerX = prev.x + prev.width / 2;
      const centerY = prev.y + prev.height / 2;
      const newX = centerX - newWidth / 2;
      const newY = centerY - newHeight / 2;
      
      return {
        x: Math.max(0, Math.min(videoMetadata.width - newWidth, newX)),
        y: Math.max(0, Math.min(videoMetadata.height - newHeight, newY)),
        width: newWidth,
        height: newHeight,
        scale: newScale
      };
    });
  };
  
  const resetCrop = () => {
    // Reset to default centered crop
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    const defaultCropWidth = videoWidth;
    const defaultCropHeight = videoWidth * (16/9); // Apply 9:16 aspect ratio
    
    setCropArea({
      x: 0,
      y: (videoHeight - defaultCropHeight) / 2, // Center vertically
      width: defaultCropWidth,
      height: defaultCropHeight,
      scale: 1
    });
    
    setCurrentAspectRatio(9/16);
  };

  // Filter components
  const renderFilterOptions = () => {
    return (
      <div className="grid grid-cols-5 gap-3">
        {filters.map(filter => (
          <div 
            key={filter.type}
            className={`
              cursor-pointer rounded-lg overflow-hidden transition-all transform hover:scale-105
              ${selectedFilter === filter.type ? 'ring-2 ring-primary shadow-md' : 'ring-1 ring-border/40 hover:ring-border'}
            `}
            onClick={() => setSelectedFilter(filter.type)}
          >
            {filter.type === "none" ? (
              <div className="aspect-video bg-muted/80 flex items-center justify-center text-xs text-center p-1">
                {filter.label}
              </div>
            ) : (
              <div className="relative aspect-video">
                <div 
                  className="w-full h-full bg-cover bg-center rounded-lg" 
                  style={{ 
                    backgroundImage: `url(${cropPreview || ''})`,
                    filter: filterValues[filter.type] 
                  }}
                ></div>
                <div className="absolute inset-x-0 bottom-0 flex justify-center pb-1 bg-gradient-to-t from-black/70 to-transparent pt-3">
                  <span className="text-[10px] text-white font-medium px-1">
                    {filter.label}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderFilterAdjustments = () => {
    return (
      <div className="space-y-4 mt-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">
              {isRtl ? "السطوع" : "Brightness"}
            </label>
            <span className="text-xs text-muted-foreground">{brightness}%</span>
          </div>
          <Slider
            value={[brightness]}
            min={50}
            max={150}
            step={1}
            onValueChange={(values) => setBrightness(values[0])}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">
              {isRtl ? "التباين" : "Contrast"}
            </label>
            <span className="text-xs text-muted-foreground">{contrast}%</span>
          </div>
          <Slider
            value={[contrast]}
            min={50}
            max={150}
            step={1}
            onValueChange={(values) => setContrast(values[0])}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">
              {isRtl ? "التشبع" : "Saturation"}
            </label>
            <span className="text-xs text-muted-foreground">{saturation}%</span>
          </div>
          <Slider
            value={[saturation]}
            min={0}
            max={200}
            step={1}
            onValueChange={(values) => setSaturation(values[0])}
          />
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-2" 
          onClick={resetFilterAdjustments}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          {isRtl ? "إعادة ضبط" : "Reset Adjustments"}
        </Button>
      </div>
    );
  };
  
  return (
    <div className="grid gap-4">
      <div className="relative bg-black rounded-md overflow-hidden h-[400px] flex items-center justify-center">
        <video 
          ref={videoRef}
          src={videoSrc}
          className="max-w-full max-h-full"
          style={{ filter: getFilterStyle() }}
          muted
          playsInline
          onClick={togglePlayback}
        />
        
        {isReady && activeTab === "crop" && (
          <div 
            className="absolute border-2 border-primary pointer-events-none"
            style={{
              left: `${(cropArea.x / videoMetadata.width) * 100}%`,
              top: `${(cropArea.y / videoMetadata.height) * 100}%`,
              width: `${(cropArea.width / videoMetadata.width) * 100}%`,
              height: `${(cropArea.height / videoMetadata.height) * 100}%`
            }}
          />
        )}
        
        <div className="absolute bottom-2 left-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={togglePlayback}
          >
            {isPlaying ? (isRtl ? "إيقاف" : "Pause") : (isRtl ? "تشغيل" : "Play")}
          </Button>
        </div>
        
        {activeTab === "filter" && selectedFilter !== "none" && (
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
            {isRtl ? 
              `فلتر: ${filters.find(f => f.type === selectedFilter)?.label}` : 
              `Filter: ${filters.find(f => f.type === selectedFilter)?.label}`
            }
          </div>
        )}
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as "crop" | "filter")}
        className={isRtl ? "rtl" : ""}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="crop">
            <Crop className="h-4 w-4 mr-2" />
            {isRtl ? "قص" : "Crop"}
          </TabsTrigger>
          <TabsTrigger value="filter">
            <Sparkles className="h-4 w-4 mr-2" />
            {isRtl ? "فلتر" : "Filter"}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="crop" className="mt-4">
          <div className="flex items-center gap-4">
            <div className="w-28 h-40 bg-muted rounded-md overflow-hidden relative">
              <canvas ref={canvasRef} className="w-full h-full object-contain" />
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                {isRtl ? "معاينة" : "Preview"}
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{isRtl ? "نسبة العرض للارتفاع" : "Aspect Ratio"}</label>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant={currentAspectRatio === 9/16 ? "default" : "outline"}
                    onClick={() => changeAspectRatio(9/16)}
                  >
                    9:16
                  </Button>
                  <Button 
                    size="sm" 
                    variant={currentAspectRatio === 1 ? "default" : "outline"}
                    onClick={() => changeAspectRatio(1)}
                  >
                    1:1
                  </Button>
                  <Button 
                    size="sm" 
                    variant={currentAspectRatio === 4/5 ? "default" : "outline"}
                    onClick={() => changeAspectRatio(4/5)}
                  >
                    4:5
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">{isRtl ? "الموضع" : "Position"}</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" onClick={() => adjustCropPosition('left', 10)}>
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    {isRtl ? "يمين" : "Left"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => adjustCropPosition('right', 10)}>
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    {isRtl ? "يسار" : "Right"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => adjustCropPosition('up', 10)}>
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    {isRtl ? "لأعلى" : "Up"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => adjustCropPosition('down', 10)}>
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    {isRtl ? "لأسفل" : "Down"}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">{isRtl ? "تكبير/تصغير" : "Zoom"}</label>
                <Slider
                  value={[cropArea.scale]}
                  min={0.5}
                  max={2}
                  step={0.1}
                  onValueChange={(values) => adjustScale(values[0])}
                />
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full" 
                onClick={resetCrop}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {isRtl ? "إعادة ضبط" : "Reset"}
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="filter" className="mt-4">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-primary" />
                {isRtl ? "اختر فلتر" : "Choose a Filter"}
              </h4>
              {renderFilterOptions()}
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center">
                <Sun className="h-4 w-4 mr-2 text-primary" />
                {isRtl ? "تعديلات" : "Adjustments"}
              </h4>
              {renderFilterAdjustments()}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onCancel}>
          {isRtl ? "إلغاء" : "Cancel"}
        </Button>
        <Button onClick={handleCropComplete}>
          <Crop className="h-4 w-4 mr-2" />
          {isRtl ? "تطبيق" : "Apply"}
        </Button>
      </div>
      
      {/* Hidden canvas for preview and export */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
} 
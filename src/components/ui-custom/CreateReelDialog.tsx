import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useReels } from "@/hooks/use-reels";
import { useTranslation } from "@/hooks/use-translation";
import { Film, Send, X, Info, Crop } from "lucide-react";
import { toast } from "sonner";
import { ReelUploadGuidelines } from "./ReelUploadGuidelines";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoCropper } from "./VideoCropper";

interface CreateReelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReelCreated?: () => void;
}

export function CreateReelDialog({ open, onOpenChange, onReelCreated }: CreateReelDialogProps) {
  const { user } = useAuth();
  const { createReel, uploading } = useReels();
  const { t, isRtl } = useTranslation();
  const [caption, setCaption] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [showDetailedGuidelines, setShowDetailedGuidelines] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [croppedThumbnail, setCroppedThumbnail] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (!user) return null;
  
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Check file type
      if (!file.type.startsWith('video/')) {
        toast.error(isRtl ? "يرجى اختيار ملف فيديو صالح" : "Please select a valid video file");
        return;
      }
      
      // Check file size (limit to 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error(isRtl ? "حجم الفيديو يجب أن يكون أقل من 50 ميغابايت" : "Video size must be less than 50MB");
        return;
      }
      
      setVideo(file);
      
      // Create a preview URL
      const videoUrl = URL.createObjectURL(file);
      setVideoPreview(videoUrl);
      
      // Show cropper for the video
      setShowCropper(true);
    }
  };
  
  const removeVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideo(null);
    setVideoPreview(null);
    setCroppedThumbnail(null);
    setShowCropper(false);
  };
  
  const handleOpenChange = (open: boolean) => {
    // Don't allow closing during upload
    if (!open && (uploading || isSubmitting)) {
      return;
    }
    
    if (!open && showCropper) {
      setShowCropper(false);
    }
    
    onOpenChange(open);
  };
  
  const handleCropComplete = (croppedBlob: Blob) => {
    setCroppedThumbnail(croppedBlob);
    setShowCropper(false);
    
    // Create a preview URL for the thumbnail to display in the UI
    if (croppedThumbnail) {
      URL.revokeObjectURL(URL.createObjectURL(croppedThumbnail));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!video) {
      toast.error(isRtl ? "يرجى اختيار فيديو" : "Please select a video");
      return;
    }
    
    // Prevent multiple submissions
    if (uploading || isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Include the cropped thumbnail if available
      const options = croppedThumbnail ? { caption, video, thumbnail: croppedThumbnail } : { caption, video };
      
      const newReel = await createReel(options);
      
      if (newReel !== null) {
        setCaption("");
        removeVideo();
        
        if (onReelCreated) {
          onReelCreated();
        }
        
        // Success! Close the dialog
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error creating reel:", error);
      toast.error(isRtl ? "حدث خطأ أثناء النشر. يرجى المحاولة مرة أخرى." : "Error posting. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={`${showCropper ? 'sm:max-w-[700px]' : 'sm:max-w-[600px]'} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>
            {showCropper && videoPreview 
              ? (isRtl ? "تحرير الفيديو والصورة المصغرة" : "Edit Video & Thumbnail") 
              : (isRtl ? "إنشاء ريل جديد" : "Create New Reel")}
          </DialogTitle>
        </DialogHeader>
        
        {showCropper && videoPreview ? (
          <div className="pt-4">
            <VideoCropper 
              videoSrc={videoPreview}
              onCrop={handleCropComplete}
              onCancel={() => setShowCropper(false)}
            />
          </div>
        ) : (
          <Tabs defaultValue="upload" className="mt-2">
            <TabsList className={`grid w-full grid-cols-2`}>
              <TabsTrigger value="upload">{isRtl ? "تحميل" : "Upload"}</TabsTrigger>
              <TabsTrigger value="guidelines">{isRtl ? "الإرشادات" : "Guidelines"}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="pt-4">
              <form onSubmit={handleSubmit} dir={isRtl ? "rtl" : "ltr"}>
                <div className="grid gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={user.avatar} alt={user.displayName} />
                      <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <p className="font-medium">{user.displayName}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <ReelUploadGuidelines />
                  </div>
                  
                  <div>
                    <Label htmlFor="caption">{isRtl ? "الوصف" : "Caption"}</Label>
                    <Textarea
                      id="caption"
                      placeholder={isRtl ? "أضف وصفاً لريلك..." : "Add a caption to your reel..."}
                      value={caption}
                      onChange={e => setCaption(e.target.value)}
                      className="resize-none"
                      rows={3}
                      dir={isRtl ? "rtl" : "ltr"}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="video">{isRtl ? "الفيديو" : "Video"}</Label>
                    
                    {videoPreview ? (
                      <div className="relative mt-2 rounded-md overflow-hidden bg-black aspect-[9/16] max-h-[300px]">
                        <video 
                          src={videoPreview} 
                          className="w-full h-full object-contain"
                          controls
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className={`absolute top-2 ${isRtl ? "right-2" : "left-2"} h-8 w-8 opacity-90`}
                          onClick={removeVideo}
                          disabled={uploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="absolute bottom-2 right-2"
                          onClick={() => setShowCropper(true)}
                          disabled={uploading}
                        >
                          <Crop className="h-4 w-4 mr-2" />
                          {isRtl ? "تحرير وقص" : "Edit & Crop"}
                        </Button>
                        
                        {croppedThumbnail && (
                          <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                            {isRtl ? "تم تعديل الصورة المصغرة" : "Thumbnail set"}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2">
                        <input
                          type="file"
                          accept="video/*"
                          id="video-upload"
                          className="hidden"
                          onChange={handleVideoChange}
                          disabled={uploading}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className={`w-full h-32 border-dashed flex flex-col gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
                          onClick={() => document.getElementById("video-upload")?.click()}
                          disabled={uploading}
                        >
                          <Film className="h-8 w-8 opacity-50" />
                          <span>{isRtl ? "انقر لاختيار فيديو" : "Click to select a video"}</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                <DialogFooter className="mt-6">
                  <Button
                    type="submit"
                    className={`gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
                    disabled={uploading || isSubmitting || !video}
                  >
                    {(uploading || isSubmitting) ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                        <span>{isRtl ? "جاري النشر..." : "Publishing..."}</span>
                      </div>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>{isRtl ? "نشر الريل" : "Post Reel"}</span>
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>
            
            <TabsContent value="guidelines" className="pt-4">
              <ReelUploadGuidelines detailed={true} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
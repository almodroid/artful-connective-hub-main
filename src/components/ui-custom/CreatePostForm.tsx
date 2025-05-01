
import { useState } from "react";
import { Image, Send, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { usePosts } from "@/hooks/use-posts";
import { useTranslation } from "@/hooks/use-translation";

interface CreatePostFormProps {
  onPostCreated?: () => void;
}

export function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const { user } = useAuth();
  const { createPost, uploading } = usePosts();
  const { isRtl, t } = useTranslation();
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  if (!user) return null;
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(isRtl ? "حجم الصورة يجب أن يكون أقل من 5 ميغابايت" : "Image size must be less than 5MB");
        return;
      }
      
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && !image) {
      toast.error(isRtl ? "يرجى كتابة محتوى أو إضافة صورة" : "Please write content or add an image");
      return;
    }
    
    try {
      console.log("Submitting post with content:", content.substring(0, 30) + "...");
      console.log("Image included:", image ? "Yes" : "No");
      
      await createPost({ content, image });
      setContent("");
      setImage(null);
      setImagePreview(null);
      
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error(isRtl ? "حدث خطأ أثناء نشر المنشور" : "Error publishing post");
    }
  };
  
  return (
    <Card className="border-border/40 bg-card/30 mb-8">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className={`flex gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={user.avatar} alt={user.displayName} />
              <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <Textarea
                placeholder={isRtl ? "ماذا يدور في ذهنك؟ يمكنك استخدام # للوسوم و @ للإشارة للمستخدمين" : "What's on your mind? Use # for tags and @ to mention users"}
                value={content}
                onChange={e => setContent(e.target.value)}
                className="min-h-20 border-none bg-secondary/30 focus-visible:ring-0 resize-none px-4 py-3"
                disabled={uploading}
                dir={isRtl ? "rtl" : "ltr"}
              />
              
              {imagePreview && (
                <div className="relative mt-3 rounded-md overflow-hidden">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-h-64 w-full object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className={`absolute top-2 ${isRtl ? "right-2" : "left-2"} h-8 w-8 opacity-90`}
                    onClick={removeImage}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <div className={`flex justify-between items-center mt-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className={`flex gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <input
                    type="file"
                    accept="image/*"
                    id="image-upload"
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={uploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
                    onClick={() => document.getElementById("image-upload")?.click()}
                    disabled={uploading}
                  >
                    <Image className="h-4 w-4" />
                    <span>{isRtl ? "إضافة صورة" : "Add Image"}</span>
                  </Button>
                </div>
                
                <Button
                  type="submit"
                  size="sm"
                  className={`gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
                  disabled={uploading || (!content.trim() && !image)}
                >
                  {uploading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      <span>{isRtl ? "جاري النشر..." : "Publishing..."}</span>
                    </div>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>{isRtl ? "نشر" : "Post"}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

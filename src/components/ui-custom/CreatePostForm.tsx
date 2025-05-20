
import { useState, useEffect } from "react";
import { Image, Send, X, Link as LinkIcon, GalleryHorizontalEnd, SmilePlus, Loader2, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { usePosts } from "@/hooks/use-posts";
import { useTranslation } from "@/hooks/use-translation";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Grid } from "@giphy/react-components";

const giphy = new GiphyFetch(import.meta.env.VITE_GIPHY_KEY || '');

interface CreatePostFormProps {
  onPostCreated?: () => void;
}

export function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const { user } = useAuth();
  const { createPost, uploading } = usePosts();
  const { isRtl, t } = useTranslation();
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [videoPreview, setVideoPreview] = useState<string[]>([]);
  const [link, setLink] = useState("");
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'images' | 'video' | 'gif' | null>(null);
  const [giphySearch, setGiphySearch] = useState('');
  const [giphyResults, setGiphyResults] = useState<any[]>([]);
  const [loadingGiphy, setLoadingGiphy] = useState(false);
  
  useEffect(() => {
    if (showGifPicker && giphyResults.length === 0) {
      setLoadingGiphy(true);
      fetch(`https://api.giphy.com/v1/gifs/search?api_key=${import.meta.env.VITE_GIPHY_KEY}&q=meme&limit=12`)
        .then(res => res.json())
        .then(data => {
          setGiphyResults(data.data || []);
          setLoadingGiphy(false);
        })
        .catch(error => {
          console.error('Error loading trending GIFs:', error);
          setLoadingGiphy(false);
        });
    }
  }, [showGifPicker]);
  
  if (!user) return null;
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 2) {
      toast.error(isRtl ? "يمكنك تحميل صورتين كحد أقصى" : "You can upload maximum 2 images");
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(isRtl ? `${file.name} - حجم الصورة يجب أن يكون أقل من 5 ميغابايت` : `${file.name} - Image size must be less than 5MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setMediaType('images');
      setSelectedGif(null);
      setVideos([]);
      setVideoPreview([]);
      setImages(validFiles);
      
      Promise.all(
        validFiles.map(file => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        })
      ).then(previews => setImagePreview(previews));
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 1) {
      toast.error(isRtl ? "يمكنك تحميل فيديو واحد كحد أقصى" : "You can upload maximum 1 video");
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(isRtl ? `${file.name} - حجم الفيديو يجب أن يكون أقل من 50 ميغابايت` : `${file.name} - Video size must be less than 50MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setMediaType('video');
      setSelectedGif(null);
      setImages([]);
      setImagePreview([]);
      setVideos(validFiles);
      
      Promise.all(
        validFiles.map(file => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        })
      ).then(previews => setVideoPreview(previews));
    }
  };

  const handleGifSelect = (gif: any) => {
    setSelectedGif(gif.images.original.url);
    setMediaType('gif');
    setImages([]);
    setImagePreview([]);
    setVideos([]);
    setVideoPreview([]);
    setShowGifPicker(false);
  };

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLink(e.target.value);
  };
  
  const removeMedia = () => {
    setImages([]);
    setImagePreview([]);
    setVideos([]);
    setVideoPreview([]);
    setSelectedGif(null);
    setMediaType(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && !images.length && !videos.length && !selectedGif && !link) {
      toast.error(isRtl ? "يرجى كتابة محتوى أو إضافة وسائط أو رابط" : "Please write content or add media or a link");
      return;
    }
    
    try {
      console.log("Submitting post with content:", content.substring(0, 30) + "...");
      console.log("Media included:", mediaType ? "Yes" : "No");
      
      await createPost({ 
        content, 
        images: mediaType === 'images' ? images : [], 
        videos: mediaType === 'video' ? videos : [],
        gifUrl: mediaType === 'gif' ? selectedGif : null,
        link
      });
      setContent("");
      setImages([]);
      setImagePreview([]);
      setVideos([]);
      setVideoPreview([]);
      setSelectedGif(null);
      setLink("");
      setMediaType(null);
      
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
              
              {showGifPicker && (
                <div className="mt-3 rounded-md overflow-hidden bg-background/95 p-4">
                  <div className="mb-3">
                    <Input
                      type="text"
                      placeholder={isRtl ? "ابحث عن GIF" : "Search GIFs"}
                      value={giphySearch}
                      onChange={(e) => {
                        setGiphySearch(e.target.value);
                        if (e.target.value.trim()) {
                          setLoadingGiphy(true);
                          fetch(`https://api.giphy.com/v1/gifs/search?api_key=${import.meta.env.VITE_GIPHY_KEY}&q=${encodeURIComponent(e.target.value)}&limit=20`)
                            .then(res => res.json())
                            .then(data => {
                              setGiphyResults(data.data || []);
                              setLoadingGiphy(false);
                            })
                            .catch(error => {
                              console.error('Error searching Giphy:', error);
                              setLoadingGiphy(false);
                            });
                        } else {
                          setLoadingGiphy(true);
                          fetch(`https://api.giphy.com/v1/gifs/search?api_key=${import.meta.env.VITE_GIPHY_KEY}&q=meme&limit=12`)
                            .then(res => res.json())
                            .then(data => {
                              setGiphyResults(data.data || []);
                              setLoadingGiphy(false);
                            })
                            .catch(error => {
                              console.error('Error loading trending memes:', error);
                              setLoadingGiphy(false);
                            });
                        }
                      }}
                      className="mb-2"
                    />
                    {loadingGiphy ? (
                      <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 max-h-80 overflow-y-auto">
                        {giphyResults.map((gif) => (
                          <div 
                            key={gif.id} 
                            className="cursor-pointer hover:opacity-90"
                            onClick={() => handleGifSelect(gif)}
                          >
                            <img 
                              src={gif.images.fixed_height_small.url} 
                              alt={gif.title}
                              className="w-full h-20 object-cover rounded"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {imagePreview.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {imagePreview.map((preview, index) => (
                    <div key={index} className="relative rounded-md overflow-hidden">
                      <img 
                        src={preview} 
                        alt={`Preview ${index + 1}`} 
                        className="max-h-64 w-full object-cover rounded-md"
                      />
                      {index === 0 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className={`absolute top-2 ${isRtl ? "right-2" : "left-2"} h-8 w-8 opacity-90`}
                          onClick={removeMedia}
                          disabled={uploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {videoPreview.length > 0 && (
                <div className="mt-3">
                  {videoPreview.map((preview, index) => (
                    <div key={index} className="relative rounded-md overflow-hidden">
                      <video 
                        src={preview} 
                        controls
                        className="max-h-96 w-full rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className={`absolute top-2 ${isRtl ? "right-2" : "left-2"} h-8 w-8 opacity-90`}
                        onClick={removeMedia}
                        disabled={uploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {selectedGif && (
                <div className="relative mt-3 rounded-md overflow-hidden">
                  <img 
                    src={selectedGif} 
                    alt="Selected GIF" 
                    className="max-h-64 w-full object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className={`absolute top-2 ${isRtl ? "right-2" : "left-2"} h-8 w-8 opacity-90`}
                    onClick={removeMedia}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <Input
                type="url"
                placeholder={isRtl ? "أضف رابطاً" : "Add a link"}
                value={link}
                onChange={handleLinkChange}
                className="mt-3"
                disabled={uploading}
              />

              <div className={`flex justify-between items-center mt-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className={`flex gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <input
                    type="file"
                    accept="image/*"
                    id="image-upload"
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={uploading || showGifPicker || mediaType === 'video'}
                    multiple
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
                    onClick={() => document.getElementById("image-upload")?.click()}
                    disabled={uploading || showGifPicker || mediaType === 'video'}
                  >
                    <GalleryHorizontalEnd className="h-4 w-4" />
                    <span>{isRtl ? "إضافة صور" : "Add Images"}</span>
                  </Button>

                  <input
                    type="file"
                    accept="video/*"
                    id="video-upload"
                    className="hidden"
                    onChange={handleVideoChange}
                    disabled={uploading || showGifPicker || mediaType === 'images' || mediaType === 'gif'}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
                    onClick={() => document.getElementById("video-upload")?.click()}
                    disabled={uploading || showGifPicker || mediaType === 'images' || mediaType === 'gif'}
                  >
                    <Video className="h-4 w-4" />
                    <span>{isRtl ? "إضافة فيديو" : "Add Video"}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
                    onClick={() => setShowGifPicker(!showGifPicker)}
                    disabled={uploading || mediaType === 'images' || mediaType === 'video'}
                  >
                    <SmilePlus className="h-4 w-4" />
                    <span>{isRtl ? "إضافة GIF" : "Add GIF"}</span>
                  </Button>
                </div>
                
                <Button
                  type="submit"
                  size="sm"
                  className={`gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
                  disabled={uploading || (!content.trim() && !images.length && !videos.length && !selectedGif && !link)}
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
